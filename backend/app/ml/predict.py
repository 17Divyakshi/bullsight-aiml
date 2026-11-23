"""
BULLSIGHT CE-2 Next-Session Closing Price Inference Engine

Loads stock-specific Colab models (Linear Regression, Random Forest, LSTM),
saved feature/target scalers, and metadata. Generates next observed trading session
closing-price predictions only — never fabricates placeholder forecasts or multi-day extrapolations.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional
import numpy as np

from app.db.stocks_data import CE2_SUPPORTED_SYMBOLS, get_stock_by_symbol
from app.ml.feature_engineering import CE2_FEATURE_COLUMNS, compute_ce2_features
from app.services.ce2_artifact_service import (
    is_ce2_supported_symbol,
    load_stock_inference_bundle,
    sanitize_symbol,
)
from app.services.yahoo_service import fetch_adjusted_ohlc_for_ml

logger = logging.getLogger("bullsight.predict")

SIGNAL_DISCLAIMER = "Experimental AI-generated signal for educational purposes only. Not financial advice."


def _compute_signal(predicted_change_pct: float, buy_threshold: float, sell_threshold: float) -> tuple:
    if predicted_change_pct > buy_threshold:
        return "BUY", "BULLISH"
    if predicted_change_pct < sell_threshold:
        return "SELL", "BEARISH"
    return "HOLD", "NEUTRAL"


def generate_stock_prediction(
    symbol: str,
    buy_threshold: Optional[float] = None,
    sell_threshold: Optional[float] = None,
) -> dict:
    """
    Runs next-session closing price prediction for one of the 5 supported CE-2 stocks:
    ^NSEI, RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS.
    """
    sym = sanitize_symbol(symbol)
    buy_thr = float(buy_threshold if buy_threshold is not None else os.getenv("SIGNAL_BUY_THRESHOLD_PCT", "1.0"))
    sell_thr = float(sell_threshold if sell_threshold is not None else os.getenv("SIGNAL_SELL_THRESHOLD_PCT", "-1.0"))
    thresholds = {"buy_gt_pct": buy_thr, "sell_lt_pct": sell_thr}

    stock_meta = get_stock_by_symbol(sym) or {}
    stock_name = stock_meta.get("name", sym)

    if not is_ce2_supported_symbol(sym):
        return {
            "symbol": sym,
            "stock_name": stock_name,
            "supported": False,
            "supported_symbols": CE2_SUPPORTED_SYMBOLS,
            "last_observed_date": None,
            "last_observed_close": None,
            "predicted_next_close": None,
            "predicted_change_percent": None,
            "selected_model": None,
            "signal": None,
            "trend": None,
            "signal_thresholds": thresholds,
            "signal_disclaimer": SIGNAL_DISCLAIMER,
            "ml_verified": False,
            "verification_status": "unsupported_symbol",
            "training_cutoff_date": None,
            "data_freshness": None,
            "missing_artifacts": [],
            "message": f"{sym} is outside the 5 trained CE-2 models ({', '.join(CE2_SUPPORTED_SYMBOLS)}).",
        }

    # Fetch latest adjusted OHLC market data
    ohlc_res = fetch_adjusted_ohlc_for_ml(sym, period="1y")
    last_date = ohlc_res.get("last_observed_date")
    last_close = ohlc_res.get("last_observed_close")
    data_freshness = {
        "fetched_at": ohlc_res.get("fetched_at") or datetime.now(timezone.utc).isoformat(),
        "last_trading_date": last_date,
        "source": ohlc_res.get("source", "Yahoo Finance (auto_adjust=True)"),
        "is_live": bool(ohlc_res.get("success")),
    }

    # Inspect and load stock-specific Colab model artifacts
    bundle = load_stock_inference_bundle(sym)
    meta = bundle.get("metadata") or {}
    training_cutoff = meta.get("training_cutoff_date") or meta.get("cutoff_date") or meta.get("train_end_date")

    if not bundle.get("ready"):
        return {
            "symbol": sym,
            "stock_name": stock_name,
            "supported": True,
            "last_observed_date": last_date,
            "last_observed_close": last_close,
            "predicted_next_close": None,
            "predicted_change_percent": None,
            "selected_model": bundle.get("selected_model"),
            "signal": None,
            "trend": None,
            "signal_thresholds": thresholds,
            "signal_disclaimer": SIGNAL_DISCLAIMER,
            "ml_verified": False,
            "verification_status": "unverified_missing_artifacts",
            "training_cutoff_date": training_cutoff,
            "data_freshness": data_freshness,
            "expected_artifact_dir": bundle.get("export_dir"),
            "missing_artifacts": bundle.get("missing_artifacts", []),
            "message": (
                bundle.get("error")
                or "Trained Google Colab model artifacts for this stock are not placed in the backend yet. No prediction generated."
            ),
        }

    if not ohlc_res.get("success") or ohlc_res["df"].empty:
        return {
            "symbol": sym,
            "stock_name": stock_name,
            "supported": True,
            "last_observed_date": None,
            "last_observed_close": None,
            "predicted_next_close": None,
            "predicted_change_percent": None,
            "selected_model": bundle.get("model_type"),
            "signal": None,
            "trend": None,
            "signal_thresholds": thresholds,
            "signal_disclaimer": SIGNAL_DISCLAIMER,
            "ml_verified": False,
            "verification_status": "market_data_unavailable",
            "training_cutoff_date": training_cutoff,
            "data_freshness": data_freshness,
            "missing_artifacts": [],
            "message": ohlc_res.get("error", "Unable to fetch latest Yahoo Finance OHLC data."),
        }

    # Generate exact 14 features and apply saved feature order from metadata
    feat_df, fe_source, _ = compute_ce2_features(ohlc_res["df"])
    feature_order = meta.get("feature_columns") or CE2_FEATURE_COLUMNS
    for col in feature_order:
        if col not in feat_df.columns:
            return {
                "symbol": sym,
                "stock_name": stock_name,
                "supported": True,
                "last_observed_date": last_date,
                "last_observed_close": last_close,
                "predicted_next_close": None,
                "predicted_change_percent": None,
                "selected_model": bundle.get("model_type"),
                "signal": None,
                "trend": None,
                "signal_thresholds": thresholds,
                "signal_disclaimer": SIGNAL_DISCLAIMER,
                "ml_verified": False,
                "verification_status": "feature_mismatch",
                "training_cutoff_date": training_cutoff,
                "data_freshness": data_freshness,
                "missing_artifacts": [],
                "message": f"Required feature column '{col}' missing from generated feature DataFrame.",
            }

    X_raw = feat_df[feature_order].copy()
    
    if bundle.get("is_final_pipeline"):
        # Final pipeline handles its own preprocessing
        X_scaled = X_raw
    else:
        # Original models require their saved feature scaler
        X_scaled = bundle["feature_scaler"].transform(X_raw)


    model_type = str(bundle["model_type"])
    model_obj = bundle["model"]
    target_scaler = bundle.get("target_scaler")

    if "lstm" in model_type.lower():
        seq_len = int(meta.get("sequence_length") or meta.get("lookback") or 20)
        if len(X_scaled) < seq_len:
            return {
                "symbol": sym,
                "stock_name": stock_name,
                "supported": True,
                "last_observed_date": last_date,
                "last_observed_close": last_close,
                "predicted_next_close": None,
                "predicted_change_percent": None,
                "selected_model": model_type,
                "signal": None,
                "trend": None,
                "signal_thresholds": thresholds,
                "signal_disclaimer": SIGNAL_DISCLAIMER,
                "ml_verified": False,
                "verification_status": "insufficient_history",
                "training_cutoff_date": training_cutoff,
                "data_freshness": data_freshness,
                "missing_artifacts": [],
                "message": f"Need at least {seq_len} feature rows for LSTM sequence inference; got {len(X_scaled)}.",
            }
        seq_input = np.asarray(X_scaled[-seq_len:]).reshape(1, seq_len, len(feature_order))
        pred_raw = model_obj.predict(seq_input, verbose=0)
    else:
        latest_row = np.asarray(X_scaled[-1:]).reshape(1, -1)
        pred_raw = model_obj.predict(latest_row)

    pred_arr = np.array(pred_raw).reshape(-1, 1)
    if target_scaler is not None:
        predicted_next_close = float(target_scaler.inverse_transform(pred_arr)[0][0])
    else:
        predicted_next_close = float(pred_arr[0][0])

    predicted_next_close = round(predicted_next_close, 2)
    predicted_change_pct = round(((predicted_next_close - last_close) / last_close) * 100.0, 2) if last_close else 0.0
    signal, trend = _compute_signal(predicted_change_pct, buy_thr, sell_thr)

    return {
        "symbol": sym,
        "stock_name": stock_name,
        "supported": True,
        "last_observed_date": last_date,
        "last_observed_close": last_close,
        "predicted_next_close": predicted_next_close,
        "predicted_change_percent": predicted_change_pct,
        "selected_model": model_type,
        "signal": signal,
        "trend": trend,
        "signal_thresholds": thresholds,
        "signal_disclaimer": SIGNAL_DISCLAIMER,
        "ml_verified": True,
        "verification_status": "verified",
        "training_cutoff_date": training_cutoff,
        "feature_engineering_source": fe_source,
        "feature_count": len(feature_order),
        "data_freshness": data_freshness,
        "missing_artifacts": [],
        "message": "Next-session closing price prediction generated from trained Colab artifacts.",
    }
