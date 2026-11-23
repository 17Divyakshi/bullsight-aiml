from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from app.services.ce2_artifact_service import (
    get_ce2_overall_status,
    get_exported_backtesting_data,
    resolve_plot_file,
)

router = APIRouter(tags=["ce2"])


@router.get("/ce2/status")
def ce2_status():
    """
    Reports per-stock artifact readiness for the 5 CE-2 supported assets
    plus availability of exported evaluation and backtesting CSVs.
    """
    return get_ce2_overall_status()


@router.get("/backtesting")
def get_backtesting(symbol: Optional[str] = Query(None, description="Optional CE-2 ticker filter")):
    """
    Returns real Colab-exported backtesting results from backtesting_results.csv.
    Does not fabricate or simulate returns if the CSV is absent.
    """
    return get_exported_backtesting_data(symbol=symbol)


@router.get("/ce2/plots/{filename}")
def get_plot_image(filename: str):
    """
    Serves exported PNG/JPEG plot images from CE2_EXPORT_DIR/plots securely.
    """
    resolved = resolve_plot_file(filename)
    if not resolved:
        raise HTTPException(status_code=404, detail="Requested plot image not found.")
    return FileResponse(str(resolved))
