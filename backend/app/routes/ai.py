from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.ai_service import process_ai_chat
from app.services.ce2_artifact_service import get_exported_evaluation_data
from app.schemas.stock import AIChatRequest, AIChatResponse, ModelMetricsResponse

router = APIRouter(tags=["ai"])


@router.post("/ai/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest):
    """
    Processes conversational user queries to BullSight AI.
    Grounds answers in real backend stock data, technical indicator values, and verified CE-2 status.
    """
    try:
        return process_ai_chat(payload.message, context_symbol=payload.context_symbol or "^NSEI")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in BullSight AI Assistant: {str(e)}")


@router.get("/model/metrics", response_model=ModelMetricsResponse)
def get_metrics(symbol: Optional[str] = Query(None, description="Optional CE-2 ticker filter")):
    """
    Returns real evaluation metrics and test predictions from Colab-exported CSVs
    (model_metrics.csv, test_predictions.csv, feature_importance.csv, lstm_history.csv).
    """
    return get_exported_evaluation_data(symbol=symbol)


@router.post("/model/train")
def trigger_training():
    """
    In-app training is disabled for CE-2: all models are trained externally in Google Colab.
    """
    raise HTTPException(
        status_code=400,
        detail="In-app retraining is disabled. Models are trained externally in Google Colab and loaded from CE2_EXPORT_DIR.",
    )

