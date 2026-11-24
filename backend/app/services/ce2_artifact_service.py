"""
CE-2 Artifact Service

Reads and validates Colab-exported models, metadata, scalers, evaluation CSVs,
backtesting CSVs, and exported PNG plots from CE2_EXPORT_DIR (default: backend/ce2_export).
Never generates fake models, fake predictions, or fabricated evaluation numbers.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import pandas as pd

from app.db.stocks_data import CE2_STOCKS, CE2_SUPPORTED_SYMBOLS

logger = logging.getLogger("bullsight.ce2_artifacts")

_DEFAULT_EXPORT_DIR = Path(__file__).resolve().parents[2] / "ce2_export"


def get_export_dir() -> Path:
    return Path(os.getenv("CE2_EXPORT_DIR", str(_DEFAULT_EXPORT_DIR))).resolve()


def sanitize_symbol(symbol: str) -> str:
    return symbol.upper().strip()


def symbol_folder_candidates(symbol: str) -> List[str]:
    sym = sanitize_symbol(symbol)

    folder_mapping = {
        "^NSEI": "NIFTY50",
        "RELIANCE.NS": "RELIANCE",
        "TCS.NS": "TCS",
        "INFY.NS": "INFOSYS",
        "HDFCBANK.NS": "HDFCBANK",
    }

    mapped = folder_mapping.get(sym)
    no_caret = sym.replace("^", "")
    underscored = no_caret.replace(".", "_").replace("-", "_")

    candidates = [
        mapped,
        underscored,
        no_caret,
        sym,
        sym.lower(),
        underscored.lower(),
    ]

    return list(dict.fromkeys(
        candidate for candidate in candidates if candidate
    ))


def is_ce2_supported_symbol(symbol: str) -> bool:
    return sanitize_symbol(symbol) in CE2_SUPPORTED_SYMBOLS


def _safe_resolve_inside(base_dir: Path, target: Path) -> Optional[Path]:
    resolved_base = base_dir.resolve()
    resolved_target = target.resolve()
    if resolved_target == resolved_base or str(resolved_target).startswith(str(resolved_base) + os.sep):
        return resolved_target
    return None


def _find_first_existing(base_dir: Path, relative_candidates: List[str]) -> Optional[Path]:
    for rel in relative_candidates:
        candidate = _safe_resolve_inside(base_dir, base_dir / rel)
        if candidate and candidate.is_file():
            return candidate
    return None


def _find_stock_dir(export_dir: Path, symbol: str) -> Optional[Path]:
    candidates = symbol_folder_candidates(symbol)
    search_roots = [export_dir, export_dir / "models", export_dir / "artifacts"]
    for root in search_roots:
        for folder_name in candidates:
            candidate = _safe_resolve_inside(export_dir, root / folder_name)
            if candidate and candidate.is_dir():
                return candidate
    return None


def get_stock_metadata(symbol: str) -> Dict[str, Any]:
    export_dir = get_export_dir()
    sym = sanitize_symbol(symbol)
    stock_dir = _find_stock_dir(export_dir, sym)

    # 1. Stock-specific metadata.json
    if stock_dir:
        meta_path = _find_first_existing(stock_dir, ["metadata.json", "model_metadata.json"])
        if meta_path:
            with open(meta_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {"found": True, "path": str(meta_path), "data": data}

    # 2. Global metadata.json keyed by symbol
    global_meta = _find_first_existing(export_dir, ["metadata.json", "models_metadata.json"])
    if global_meta:
        with open(global_meta, "r", encoding="utf-8") as f:
            all_meta = json.load(f)
        if isinstance(all_meta, dict):
            for key in [sym, *symbol_folder_candidates(sym)]:
                if key in all_meta and isinstance(all_meta[key], dict):
                    return {"found": True, "path": str(global_meta), "data": all_meta[key]}

    return {"found": False, "path": None, "data": {}}


def inspect_stock_artifacts(symbol: str) -> Dict[str, Any]:
    """
    Inspects whether the required stock-specific model, scalers, metadata, and
    feature_engineering.py exist in CE2_EXPORT_DIR without loading heavy weights.
    """
    export_dir = get_export_dir()
    sym = sanitize_symbol(symbol)
    stock_dir = _find_stock_dir(export_dir, sym)
    meta_info = get_stock_metadata(sym)
    meta = meta_info.get("data", {})

    selected_model_raw = str(
        meta.get("selected_model")
        or meta.get("best_model")
        or meta.get("model_name")
        or ""
    ).strip()

    missing: List[str] = []
    found_files: Dict[str, str] = {}

    fe_path = _find_first_existing(export_dir, ["feature_engineering.py"])
    if fe_path:
        found_files["feature_engineering"] = str(fe_path)
    else:
        missing.append(f"{export_dir}/feature_engineering.py")

    if not meta_info["found"]:
        missing.append(f"{export_dir}/models/{symbol_folder_candidates(sym)[0]}/metadata.json")
    else:
        found_files["metadata"] = meta_info["path"]

    search_base = stock_dir or export_dir


    # Final model retrained on train + validation data
    final_model_name = meta.get("final_model_file")
    if final_model_name:
        final_pipeline_path = _find_first_existing(
            search_base, [final_model_name]
        )
        if final_pipeline_path:
            found_files["selected_final_pipeline"] = str(final_pipeline_path)

    safe_tag = symbol_folder_candidates(sym)[0]

    # Locate candidate model files
    lr_path = _find_first_existing(
        search_base,
        ["linear_regression.joblib", "linear_regression.pkl", f"{safe_tag}_linear_regression.joblib", f"{safe_tag}_lr.pkl"],
    )
    rf_path = _find_first_existing(
        search_base,
        ["random_forest.joblib", "random_forest.pkl", f"{safe_tag}_random_forest.joblib", f"{safe_tag}_rf.pkl"],
    )
    lstm_path = _find_first_existing(
        search_base,
        ["lstm_model.keras", "lstm.keras", "lstm_model.h5", f"{safe_tag}_lstm.keras"],
    )
    feat_scaler_path = _find_first_existing(
        search_base,
        ["feature_scaler.joblib", "feature_scaler.pkl", "scaler_X.pkl", "scaler_x.joblib", "x_scaler.pkl"],
    )
    target_scaler_path = _find_first_existing(
        search_base,
        ["target_scaler.joblib", "target_scaler.pkl", "scaler_y.pkl", "scaler_y.joblib", "y_scaler.pkl"],
    )

    if lr_path:
        found_files["linear_regression"] = str(lr_path)
    if rf_path:
        found_files["random_forest"] = str(rf_path)
    if lstm_path:
        found_files["lstm"] = str(lstm_path)
    if feat_scaler_path:
        found_files["feature_scaler"] = str(feat_scaler_path)
    else:
        missing.append(f"{export_dir}/models/{safe_tag}/feature_scaler.joblib")
    if target_scaler_path:
        found_files["target_scaler"] = str(target_scaler_path)
    else:
        missing.append(f"{export_dir}/models/{safe_tag}/target_scaler.joblib")

    # Determine whether the selected model (or any trained model) exists
    sel_low = selected_model_raw.lower()
    selected_model_file = None
    if "lstm" in sel_low:
        selected_model_file = lstm_path
    elif "forest" in sel_low or sel_low == "rf":
        selected_model_file = rf_path
    elif "linear" in sel_low or sel_low == "lr":
        selected_model_file = lr_path
    else:
        selected_model_file = lstm_path or rf_path or lr_path

    if not selected_model_file:
        missing.append(
            f"{export_dir}/models/{safe_tag}/(linear_regression.joblib | random_forest.joblib | lstm_model.keras)"
        )

    # Check whether the final retrained model is available
    has_final_pipeline = "selected_final_pipeline" in found_files

    is_ready = bool(
        meta_info["found"]
        and (
            has_final_pipeline
            or (
                selected_model_file
                and feat_scaler_path
                and (target_scaler_path or "lstm" not in sel_low)
            )
        )
    )

    return {
        "symbol": sym,
        "supported": is_ce2_supported_symbol(sym),
        "export_dir": str(export_dir),
        "stock_dir": str(stock_dir) if stock_dir else None,
        "artifacts_ready": is_ready,
        "selected_model": selected_model_raw or None,
        "metadata": meta,
        "found_files": found_files,
        "missing_artifacts": missing,
    }


def load_stock_inference_bundle(symbol: str) -> Dict[str, Any]:
    """
    Loads the exact stock-specific selected model, feature_scaler, target_scaler,
    and metadata for inference. Returns `ready: False` if any required artifact is missing.
    """
    status = inspect_stock_artifacts(symbol)
    if not status["artifacts_ready"]:
        return {**status, "ready": False}

    found = status["found_files"]
    meta = status["metadata"]
    selected_name = str(status["selected_model"] or "").lower()

    try:

        # Load the final model retrained on train + validation data
        if "selected_final_pipeline" in found:
            final_model = joblib.load(found["selected_final_pipeline"])

            return {
                **status,
                "ready": True,
                "model": final_model,
                "model_type": status["selected_model"],
                "feature_scaler": None,
                "target_scaler": None,
                "metadata": meta,
                "is_final_pipeline": True,
            }

        feature_scaler = joblib.load(found["feature_scaler"])
        target_scaler = joblib.load(found["target_scaler"]) if "target_scaler" in found else None

        model_type = None
        model_obj = None
        if "lstm" in selected_name and "lstm" in found:
            import tensorflow as tf
            model_obj = tf.keras.models.load_model(found["lstm"])
            model_type = "LSTM"
        elif ("forest" in selected_name or selected_name == "rf") and "random_forest" in found:
            model_obj = joblib.load(found["random_forest"])
            model_type = "Random Forest Regressor"
        elif ("linear" in selected_name or selected_name == "lr") and "linear_regression" in found:
            model_obj = joblib.load(found["linear_regression"])
            model_type = "Linear Regression"
        elif "random_forest" in found:
            model_obj = joblib.load(found["random_forest"])
            model_type = "Random Forest Regressor"
        elif "linear_regression" in found:
            model_obj = joblib.load(found["linear_regression"])
            model_type = "Linear Regression"
        elif "lstm" in found:
            import tensorflow as tf
            model_obj = tf.keras.models.load_model(found["lstm"])
            model_type = "LSTM"

        if model_obj is None:
            return {**status, "ready": False, "error": "Selected model artifact could not be loaded."}

        return {
            **status,
            "ready": True,
            "model": model_obj,
            "model_type": status["selected_model"] or model_type,
            "feature_scaler": feature_scaler,
            "target_scaler": target_scaler,
            "metadata": meta,
        }
    except Exception as exc:
        logger.error(f"Failed loading inference bundle for {symbol}: {exc}")
        return {**status, "ready": False, "error": str(exc)}


def _read_csv_records(filename_candidates: List[str], symbol: Optional[str] = None) -> Dict[str, Any]:
    export_dir = get_export_dir()
    csv_path = _find_first_existing(export_dir, filename_candidates)
    if not csv_path:
        return {"available": False, "path": None, "rows": []}

    try:
        df = pd.read_csv(csv_path)
        if symbol and not df.empty:
            sym_clean = sanitize_symbol(symbol)
            for col in df.columns:
                if col.lower() in ("symbol", "ticker", "stock"):
                    filtered = df[df[col].astype(str).str.upper().str.strip() == sym_clean]
                    if not filtered.empty:
                        df = filtered
                    break
        df = df.where(pd.notnull(df), None)
        return {
            "available": True,
            "path": str(csv_path),
            "rows": df.to_dict(orient="records"),
        }
    except Exception as exc:
        logger.error(f"Failed reading CSV {csv_path}: {exc}")
        return {"available": False, "path": str(csv_path), "error": str(exc), "rows": []}


def get_exported_evaluation_data(symbol: Optional[str] = None) -> Dict[str, Any]:
    export_dir = get_export_dir()
    metrics_csv = _read_csv_records(["model_metrics.csv", "metrics/model_metrics.csv"], symbol=symbol)
    preds_csv = _read_csv_records(["test_predictions.csv", "metrics/test_predictions.csv"], symbol=symbol)
    fi_csv = _read_csv_records(["feature_importance.csv", "metrics/feature_importance.csv"], symbol=symbol)
    loss_csv = _read_csv_records(["lstm_history.csv", "lstm_loss.csv", "metrics/lstm_history.csv"], symbol=symbol)

    plots_dir = _safe_resolve_inside(export_dir, export_dir / "plots")
    plot_files: List[str] = []
    if plots_dir and plots_dir.is_dir():
        for entry in sorted(plots_dir.iterdir()):
            if entry.is_file() and entry.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
                plot_files.append(entry.name)

    meta_info = get_stock_metadata(symbol) if symbol else {"found": False, "data": {}}
    artifacts_available = bool(metrics_csv["available"] or preds_csv["available"])

    return {
        "ml_verified": artifacts_available,
        "artifacts_available": artifacts_available,
        "export_dir": str(export_dir),
        "symbol": sanitize_symbol(symbol) if symbol else None,
        "selected_model": meta_info.get("data", {}).get("selected_model") if meta_info.get("found") else None,
        "selection_criterion": "Lowest validation MAE",
        "models": metrics_csv["rows"],
        "test_predictions": preds_csv["rows"],
        "feature_importance": fi_csv["rows"],
        "lstm_history": loss_csv["rows"],
        "plots": plot_files,
        "sources": {
            "model_metrics_csv": metrics_csv["path"],
            "test_predictions_csv": preds_csv["path"],
            "feature_importance_csv": fi_csv["path"],
            "lstm_history_csv": loss_csv["path"],
        },
        "message": (
            "Loaded exported Google Colab evaluation results."
            if artifacts_available
            else f"Exported Colab evaluation files (model_metrics.csv, test_predictions.csv) were not found in {export_dir}. Place BULLSIGHT_CE2_EXPORT contents there to view real metrics."
        ),
    }



def get_exported_backtesting_data(symbol: Optional[str] = None) -> Dict[str, Any]:
    export_dir = get_export_dir()

    stock_mapping = {
        "^NSEI": "NIFTY50",
        "RELIANCE.NS": "RELIANCE",
        "TCS.NS": "TCS",
        "INFY.NS": "INFOSYS",
        "HDFCBANK.NS": "HDFCBANK",
    }

    sym = sanitize_symbol(symbol) if symbol else None
    rows = []
    summary_data = {}
    source_files = []

    for ticker, folder in stock_mapping.items():
        if sym and ticker != sym:
            continue

        csv_path = export_dir / folder / "backtest.csv"

        if csv_path.is_file():
            try:
                df = pd.read_csv(csv_path)
                df = df.astype(object).where(pd.notnull(df), None)
                rows.extend(df.to_dict(orient="records"))
                source_files.append(str(csv_path))
            except Exception as exc:
                logger.error(f"Backtesting CSV error: {exc}")

    summary_path = export_dir / "backtest_summary.csv"

    if summary_path.is_file():
        try:
            summary_df = pd.read_csv(summary_path)

            for ticker, folder in stock_mapping.items():
                matched = summary_df[
                    summary_df["stock"].astype(str).str.upper().str.strip()
                    == folder
                ]

                if not matched.empty:
                    record = matched.iloc[0]

                    summary_data[ticker] = {
                        "strategy_return_pct": float(
                            record["strategy_total_return_pct"]
                        ),
                        "buy_hold_return_pct": float(
                            record["buy_hold_total_return_pct"]
                        ),
                        "max_drawdown_pct": float(
                            record["max_drawdown_pct"]
                        ),
                        "transaction_cost": (
                            f'{record["transaction_cost_bps_per_side"]:g} bps/side'
                        ),
                        "trades": int(record["trades"]),
                        "selected_model": str(record["selected_model"]),
                    }

        except Exception as exc:
            logger.error(f"Backtesting summary error: {exc}")

    available = bool(rows)

    return {
        "available": available,
        "ml_verified": available,
        "export_dir": str(export_dir),
        "symbol": sym,
        "execution_rule": "Next-session Open entry and same-session Close exit",
        "summary": summary_data,
        "rows": rows,
        "source_file": source_files[0] if source_files else None,
        "message": (
            "Loaded exported backtesting results."
            if available
            else "Backtesting CSV files were not found."
        ),
    }




def get_ce2_overall_status() -> Dict[str, Any]:
    export_dir = get_export_dir()
    per_stock = [inspect_stock_artifacts(s["symbol"]) for s in CE2_STOCKS]
    eval_data = get_exported_evaluation_data()
    bt_data = get_exported_backtesting_data()

    return {
        "export_dir": str(export_dir),
        "export_dir_exists": export_dir.is_dir(),
        "supported_stocks": CE2_STOCKS,
        "stocks_status": per_stock,
        "ready_count": sum(1 for item in per_stock if item["artifacts_ready"]),
        "total_supported": len(per_stock),
        "evaluation_csv_available": eval_data["artifacts_available"],
        "backtesting_csv_available": bt_data["available"],
    }


def resolve_plot_file(filename: str) -> Optional[Path]:
    export_dir = get_export_dir()
    plots_dir = (export_dir / "plots").resolve()
    safe_name = os.path.basename(filename)
    candidate = (plots_dir / safe_name).resolve()
    if str(candidate).startswith(str(plots_dir) + os.sep) and candidate.is_file():
        return candidate
    return None
