import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timezone
import logging
from app.indicators.technical import compute_technical_indicators
from app.db.stocks_data import get_stock_by_symbol

logger = logging.getLogger("bullsight.yahoo")

CACHE = {}
CACHE_TTL_SECONDS = 180  # 3 minutes cache


def get_cached_or_fetch(key: str, fetch_fn):
    now = datetime.now()
    if key in CACHE:
        data, timestamp = CACHE[key]
        if (now - timestamp).total_seconds() < CACHE_TTL_SECONDS:
            return data

    try:
        data = fetch_fn()
    except Exception as e:
        logger.warning(f"Fetch failed for {key}: {e}")
        data = None

    if data is not None:
        CACHE[key] = (data, now)
    return data


def format_market_cap(val, symbol: str = "") -> str:
    if not val or pd.isna(val):
        return "Index" if symbol.upper() == "^NSEI" else "N/A"
    try:
        val = float(val)
        prefix = "₹" if symbol.upper().endswith(".NS") else "$"
        if val >= 1e12:
            return f"{prefix}{val / 1e12:.2f}T"
        elif val >= 1e9:
            return f"{prefix}{val / 1e9:.2f}B"
        elif val >= 1e6:
            return f"{prefix}{val / 1e6:.2f}M"
        return f"{prefix}{val:,.0f}"
    except Exception:
        return "N/A"


def format_volume(val) -> str:
    if val is None or pd.isna(val) or float(val) == 0:
        return "N/A"
    try:
        val = float(val)
        if val >= 1e6:
            return f"{val / 1e6:.2f}M"
        elif val >= 1e3:
            return f"{val / 1e3:.1f}K"
        return f"{val:,.0f}"
    except Exception:
        return "N/A"


def fetch_adjusted_ohlc_for_ml(symbol: str, period: str = "1y") -> dict:
    """
    Fetches historical daily data with auto_adjust=True (adjusted OHLC convention)
    for generating the exact 14 Colab features and tracking data freshness.
    """
    try:
        df = yf.download(symbol, period=period, interval="1d", auto_adjust=True, progress=False)
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)

        required_cols = ["Open", "High", "Low", "Close"]
        if df.empty or not all(col in df.columns for col in required_cols):
            return {"success": False, "df": pd.DataFrame(), "error": f"No adjusted OHLC data returned for {symbol}"}

        cols = [c for c in ["Open", "High", "Low", "Close", "Volume"] if c in df.columns]
        clean_df = df[cols].dropna(subset=required_cols).copy()
        if clean_df.empty:
            return {"success": False, "df": pd.DataFrame(), "error": f"Empty OHLC rows for {symbol}"}

        last_idx = clean_df.index[-1]
        last_date = pd.to_datetime(last_idx).strftime("%Y-%m-%d")
        last_close = round(float(clean_df["Close"].iloc[-1]), 2)

        return {
            "success": True,
            "df": clean_df,
            "last_observed_date": last_date,
            "last_observed_close": last_close,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "source": "Yahoo Finance (auto_adjust=True)",
            "is_live": True,
        }
    except Exception as e:
        logger.error(f"Error fetching adjusted OHLC for {symbol}: {e}")
        return {"success": False, "df": pd.DataFrame(), "error": str(e)}


def fetch_summary_from_yfinance(symbol: str) -> dict:
    meta = get_stock_by_symbol(symbol)
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="5d", auto_adjust=True)

        if hist.empty:
            raise ValueError(f"Yahoo Finance returned empty 5d history for {symbol}")

        current_price = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current_price
        day_high = float(hist["High"].iloc[-1])
        day_low = float(hist["Low"].iloc[-1])
        open_price = float(hist["Open"].iloc[-1])
        volume = int(hist["Volume"].iloc[-1]) if "Volume" in hist.columns and not pd.isna(hist["Volume"].iloc[-1]) else 0
        last_date = pd.to_datetime(hist.index[-1]).strftime("%Y-%m-%d")

        change = current_price - prev_close
        change_pct = (change / prev_close) * 100 if prev_close else 0.0

        info = {}
        try:
            info = ticker.info or {}
        except Exception:
            pass

        name = (meta["name"] if meta else None) or info.get("shortName") or info.get("longName") or symbol.upper()
        market_cap = info.get("marketCap")
        pe_ratio = info.get("trailingPE")

        return {
            "symbol": symbol.upper(),
            "name": name,
            "price": round(float(current_price), 2),
            "change": round(float(change), 2),
            "changePercent": round(float(change_pct), 2),
            "volume": format_volume(volume),
            "high": round(float(day_high), 2),
            "low": round(float(day_low), 2),
            "marketCap": format_market_cap(market_cap, symbol),
            "peRatio": round(float(pe_ratio), 2) if pe_ratio and not pd.isna(pe_ratio) else None,
            "openPrice": round(float(open_price), 2),
            "lastObservedDate": last_date,
            "is_live": True,
        }
    except Exception as e:
        logger.error(f"Error fetching summary for {symbol}: {e}")
        return {
            "symbol": symbol.upper(),
            "name": meta["name"] if meta else symbol.upper(),
            "price": None,
            "change": None,
            "changePercent": None,
            "volume": "N/A",
            "high": None,
            "low": None,
            "marketCap": "N/A",
            "peRatio": None,
            "openPrice": None,
            "lastObservedDate": None,
            "is_live": False,
            "error": f"Live market quote unavailable: {str(e)}",
        }


def get_stock_summary(symbol: str) -> dict:
    return get_cached_or_fetch(f"summary_{symbol}", lambda: fetch_summary_from_yfinance(symbol)) or fetch_summary_from_yfinance(symbol)


def fetch_history_from_yfinance(symbol: str, timeframe: str = "3M") -> pd.DataFrame:
    period_map = {
        "1D": "1d",
        "5D": "5d",
        "1M": "1mo",
        "3M": "3mo",
        "6M": "6mo",
        "1Y": "1y",
        "5Y": "5y",
        "MAX": "max",
    }
    interval_map = {
        "1D": "5m",
        "5D": "15m",
        "1M": "1d",
        "3M": "1d",
        "6M": "1d",
        "1Y": "1d",
        "5Y": "1wk",
        "MAX": "1mo",
    }

    period = period_map.get(timeframe.upper(), "3mo")
    interval = interval_map.get(timeframe.upper(), "1d")

    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval, auto_adjust=True)

    if df.empty:
        df = yf.download(symbol, period=period, interval=interval, auto_adjust=True, progress=False)

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.rename(columns={
        "Open": "open",
        "High": "high",
        "Low": "low",
        "Close": "close",
        "Volume": "volume",
    })

    df = df[["open", "high", "low", "close", "volume"]].dropna()
    if df.empty:
        raise ValueError(f"No historical price data found for {symbol}")
    df.reset_index(inplace=True)

    if "Date" in df.columns:
        df["date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")
    elif "Datetime" in df.columns:
        df["date"] = pd.to_datetime(df["Datetime"]).dt.strftime("%Y-%m-%d %H:%M")

    df = compute_technical_indicators(df)
    return df


def get_stock_history(symbol: str, timeframe: str = "3M") -> list:
    key = f"history_{symbol}_{timeframe}"
    df = get_cached_or_fetch(key, lambda: fetch_history_from_yfinance(symbol, timeframe))
    if df is None or df.empty:
        df = fetch_history_from_yfinance(symbol, timeframe)

    records = []
    for _, row in df.iterrows():
        records.append({
            "date": str(row["date"]),
            "open": round(float(row["open"]), 2),
            "high": round(float(row["high"]), 2),
            "low": round(float(row["low"]), 2),
            "close": round(float(row["close"]), 2),
            "volume": int(row["volume"]),
            "sma20": round(float(row["sma20"]), 2) if pd.notnull(row["sma20"]) else None,
            "sma50": round(float(row["sma50"]), 2) if pd.notnull(row["sma50"]) else None,
        })
    return records


def get_market_overview() -> list:
    def fetch_market():
        symbols_map = [
            ("^NSEI", "NIFTY 50"),
            ("^BSESN", "SENSEX"),
            ("^IXIC", "NASDAQ"),
            ("^DJI", "DOW JONES"),
            ("^GSPC", "S&P 500"),
            ("GC=F", "GOLD"),
            ("INR=X", "USD/INR"),
        ]
        items = []
        for sym, name in symbols_map:
            try:
                t = yf.Ticker(sym)
                hist = t.history(period="5d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                    prev = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price
                    change = price - prev
                    pct = (change / prev) * 100 if prev else 0.0
                    is_pos = change >= 0

                    val_str = f"{price:,.2f}" if sym != "INR=X" else f"{price:.2f}"
                    chg_str = f"{'+' if is_pos else ''}{change:.2f}"
                    pct_str = f"{'+' if is_pos else ''}{pct:.2f}%"

                    items.append({
                        "name": name,
                        "value": val_str,
                        "change": chg_str,
                        "changePercent": pct_str,
                        "isPositive": is_pos,
                    })
            except Exception:
                continue
        return items

    return get_cached_or_fetch("market_overview", fetch_market) or []
