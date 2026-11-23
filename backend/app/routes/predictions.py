from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.ml.predict import generate_stock_prediction
from app.schemas.stock import StockPredictionResponse

router = APIRouter(tags=["predictions"])


@router.get("/predictions/{symbol}", response_model=StockPredictionResponse)
@router.get("/stocks/{symbol}/prediction", response_model=StockPredictionResponse)
def get_prediction(
    symbol: str,
    buy_threshold: Optional[float] = Query(None, description="BUY threshold in % (default +1.0)"),
    sell_threshold: Optional[float] = Query(None, description="SELL threshold in % (default -1.0)"),
):
    """
    Runs next-session closing-price inference using the stock-specific Google Colab model,
    saved scalers, and 14 adjusted-OHLC features. Returns ml_verified=False if artifacts are missing.
    """
    try:
        return generate_stock_prediction(
            symbol,
            buy_threshold=buy_threshold,
            sell_threshold=sell_threshold,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating CE-2 prediction for {symbol}: {str(e)}")

