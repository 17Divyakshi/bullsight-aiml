import os
import requests
import logging
from app.services.yahoo_service import get_stock_summary, get_stock_history
from app.indicators.technical import get_indicator_signals

logger = logging.getLogger("bullsight.ai")

def _format_asset_value(symbol: str, value) -> str:
    if value is None:
        return "N/A"
    sym = (symbol or "").upper()
    if sym == "^NSEI":
        return f"{float(value):,.2f} pts"
    if sym.endswith(".NS") or sym.endswith(".BO"):
        return f"₹{float(value):,.2f}"
    return f"${float(value):,.2f}"


def process_ai_chat(message: str, context_symbol: str = "^NSEI") -> dict:
    """
    Processes conversational queries to BullSight AI.
    Grounds answers in real backend stock data, technical indicator values, and verified CE-2 status.
    """
    openai_key = os.getenv("OPENAI_API_KEY")

    summary = get_stock_summary(context_symbol)
    df_hist = fetch_history_from_yfinance_safe(context_symbol)
    indicators = get_indicator_signals(df_hist) if not df_hist.empty else {}

    price = summary.get("price")
    change_pct = summary.get("changePercent")
    rsi_val = indicators.get("rsi", {}).get("value")
    rsi_sig = indicators.get("rsi", {}).get("signal", "Neutral")
    macd_sig = indicators.get("macd", {}).get("signal", "Neutral")
    sma20_val = indicators.get("sma20", {}).get("value")

    from app.ml.predict import generate_stock_prediction
    ce2_pred = generate_stock_prediction(context_symbol)
    pred_summary = (
        f"Verified Next-Session Close Prediction: {_format_asset_value(context_symbol, ce2_pred['predicted_next_close'])} "
        f"({ce2_pred['predicted_change_percent']:+.2f}%, Model: {ce2_pred['selected_model']}, "
        f"Experimental Signal: {ce2_pred['signal']})"
        if ce2_pred.get("ml_verified")
        else f"Model Prediction Status: Unverified ({ce2_pred.get('message')})"
    )

    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {openai_key}",
                "Content-Type": "application/json",
            }
            system_prompt = (
                f"You are BullSight AI, an educational quantitative stock analytics assistant for an AIML CE-2 project. "
                f"Ground your answer in real stock data for {context_symbol}: "
                f"Price={_format_asset_value(context_symbol, price)}, Change={change_pct}%, "
                f"RSI={rsi_val} ({rsi_sig}), MACD={macd_sig}, SMA 20={_format_asset_value(context_symbol, sma20_val)}. "
                f"{pred_summary}. "
                f"Be concise, factual, never fabricate forecasts, and note that outputs are educational only."
            )
            payload = {
                "model": "gpt-3.5-turbo",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message},
                ],
                "temperature": 0.4,
                "max_tokens": 300,
            }
            res = requests.post(url, json=payload, headers=headers, timeout=8)
            if res.status_code == 200:
                reply = res.json()["choices"][0]["message"]["content"]
                return {
                    "reply": reply,
                    "sources": ["OpenAI GPT Model", "Yahoo Finance Feed", "CE-2 Model & Indicator Engine"],
                    "isFallback": False,
                }
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")

    msg_lower = message.lower()
    price_str = _format_asset_value(context_symbol, price)
    sma_str = _format_asset_value(context_symbol, sma20_val)
    chg_str = f"{change_pct:+.2f}%" if isinstance(change_pct, (int, float)) else "N/A"
    rsi_str = f"{rsi_val}" if rsi_val is not None else "N/A"

    if "rsi" in msg_lower:
        reply = (
            f"For {context_symbol}, the current 14-day RSI is {rsi_str} ({rsi_sig}). "
            f"Values below 30 suggest oversold territory, while values above 70 indicate overbought conditions."
        )
    elif "macd" in msg_lower:
        reply = (
            f"For {context_symbol}, the MACD momentum indicator is currently {macd_sig}. "
            f"Crossovers between the MACD line and its 9-period signal line are used among the 14 CE-2 input features."
        )
    elif "trend" in msg_lower or "bullish" in msg_lower or "bearish" in msg_lower or "predict" in msg_lower:
        reply = (
            f"Analysis for {context_symbol}: Latest observed price is {price_str} ({chg_str}), "
            f"SMA 20 is {sma_str}, and RSI is {rsi_str} ({rsi_sig}). {pred_summary}."
        )
    else:
        reply = (
            f"BullSight CE-2 Snapshot for {context_symbol}: Price={price_str} ({chg_str}), "
            f"RSI={rsi_str} ({rsi_sig}), MACD={macd_sig}, SMA 20={sma_str}. {pred_summary}."
        )

    return {
        "reply": reply,
        "sources": ["BullSight Quantitative Rule Engine", "Yahoo Finance Feed", "Technical Indicator Engine"],
        "isFallback": True,
    }


def fetch_history_from_yfinance_safe(symbol: str):
    from app.services.yahoo_service import fetch_history_from_yfinance
    try:
        return fetch_history_from_yfinance(symbol, timeframe='3M')
    except Exception:
        import pandas as pd
        return pd.DataFrame()
