from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from app.services.yahoo_service import (
    fetch_history_from_yfinance,
    get_market_overview,
    get_stock_summary,
)
from app.indicators.technical import get_indicator_signals
from app.ml.predict import generate_stock_prediction
from app.services.ce2_artifact_service import is_ce2_supported_symbol
from app.schemas.stock import MarketIndexItem, ScreenerItem
from app.db.stocks_data import get_all_stocks

router = APIRouter(tags=["market"])

_SCREENER_CACHE = None
_SCREENER_CACHE_TIME = None
SCREENER_TTL_SECONDS = 180


@router.get("/market/overview", response_model=List[MarketIndexItem])
def market_overview():
    """
    Returns live global market indices (NIFTY 50, SENSEX, NASDAQ, DOW JONES, S&P 500, GOLD, USD/INR).
    """
    try:
        return get_market_overview()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching market overview: {str(e)}")


def _screen_single_stock(stock_meta):
    sym = stock_meta["symbol"]
    name = stock_meta["name"]
    try:
        summary = get_stock_summary(sym)
        df_hist = fetch_history_from_yfinance(sym, timeframe="3M")
        indicators = get_indicator_signals(df_hist) if not df_hist.empty else {}

        rsi_val = indicators.get("rsi", {}).get("value")
        macd_sig = indicators.get("macd", {}).get("signal", "N/A")

        ai_pred_pct = "N/A"
        sig = "UNVERIFIED"
        ml_verified = False

        if is_ce2_supported_symbol(sym):
            pred = generate_stock_prediction(sym)
            if pred.get("ml_verified") and pred.get("predicted_change_percent") is not None:
                ai_pred_pct = str(pred["predicted_change_percent"])
                sig = pred.get("signal") or "HOLD"
                ml_verified = True

        return {
            "symbol": sym,
            "name": name,
            "price": summary.get("price"),
            "changePercent": summary.get("changePercent"),
            "volume": summary.get("volume", "N/A"),
            "marketCap": summary.get("marketCap", "N/A"),
            "rsi": str(rsi_val) if rsi_val is not None else "N/A",
            "macdSignal": macd_sig,
            "aiPredictionPct": ai_pred_pct,
            "signal": sig,
            "mlVerified": ml_verified,
            "sector": stock_meta.get("sector"),
            "exchange": stock_meta.get("exchange"),
            "market": stock_meta.get("market"),
        }
    except Exception:
        return {
            "symbol": sym,
            "name": name,
            "price": None,
            "changePercent": None,
            "volume": "N/A",
            "marketCap": "N/A",
            "rsi": "N/A",
            "macdSignal": "N/A",
            "aiPredictionPct": "N/A",
            "signal": "UNVERIFIED",
            "mlVerified": False,
            "sector": stock_meta.get("sector"),
            "exchange": stock_meta.get("exchange"),
            "market": stock_meta.get("market"),
        }


@router.get("/screener", response_model=List[ScreenerItem])
def stock_screener():
    """
    Returns screened equities across US, Indian NSE, and ETF/Crypto markets with RSI, MACD signal, and AI prediction.
    Fetches in parallel using ThreadPoolExecutor with caching.
    """
    global _SCREENER_CACHE, _SCREENER_CACHE_TIME

    now = datetime.now()
    if _SCREENER_CACHE and _SCREENER_CACHE_TIME and (now - _SCREENER_CACHE_TIME).total_seconds() < SCREENER_TTL_SECONDS:
        return _SCREENER_CACHE

    stocks = get_all_stocks()
    items = []

    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_stock = {executor.submit(_screen_single_stock, s): s for s in stocks}
        for future in as_completed(future_to_stock):
            try:
                res = future.result()
                if res:
                    items.append(res)
            except Exception:
                continue

    # Keep items stably ordered by popular first then symbol
    items.sort(key=lambda x: x["symbol"])
    _SCREENER_CACHE = items
    _SCREENER_CACHE_TIME = now

    return items
