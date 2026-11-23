"""
BULLSIGHT CE-2 Feature Engineering Loader & Canonical 14-Feature Pipeline

If the exported Colab `feature_engineering.py` is placed inside `CE2_EXPORT_DIR`
(default: `backend/ce2_export/feature_engineering.py`), this module dynamically
loads and delegates to that exact file so zero formula drift occurs.
"""

import importlib.util
import os
from pathlib import Path
import pandas as pd

CE2_FEATURE_COLUMNS = [
    "Open",
    "High",
    "Low",
    "Close",
    "SMA_10",
    "SMA_20",
    "EMA_10",
    "EMA_20",
    "RSI",
    "MACD",
    "MACD_Signal",
    "BB_Middle",
    "BB_Upper",
    "BB_Lower",
]


def _get_export_dir() -> Path:
    default_dir = Path(__file__).resolve().parents[2] / "ce2_export"
    return Path(os.getenv("CE2_EXPORT_DIR", str(default_dir))).resolve()


def load_exported_feature_engineering():
    """
    Loads the exact `feature_engineering.py` file from CE2_EXPORT_DIR if available.
    """
    export_dir = _get_export_dir()
    candidate = (export_dir / "feature_engineering.py").resolve()
    try:
        candidate.relative_to(export_dir)
    except ValueError:
        return None

    if candidate.is_file():
        spec = importlib.util.spec_from_file_location("ce2_exported_feature_engineering", str(candidate))
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            return module
    return None


def compute_ce2_features(df: pd.DataFrame):
    """
    Generates the 14 required features on adjusted OHLC DataFrame.
    Returns (featured_df, source_label, is_exported_module).
    """
    exported_mod = load_exported_feature_engineering()
    if exported_mod is not None:
        for fn_name in ("add_features", "generate_features", "create_features", "compute_features", "engineer_features"):
            fn = getattr(exported_mod, fn_name, None)
            if callable(fn):
                res = fn(df.copy())
                return res, f"exported:feature_engineering.py:{fn_name}", True

    # Canonical fallback matching the 14 documented Colab features until export file is placed
    data = df.copy()
    rename_map = {}
    for col in data.columns:
        low = str(col).lower()
        if low == "open":
            rename_map[col] = "Open"
        elif low == "high":
            rename_map[col] = "High"
        elif low == "low":
            rename_map[col] = "Low"
        elif low == "close":
            rename_map[col] = "Close"
    if rename_map:
        data = data.rename(columns=rename_map)

    data["SMA_10"] = data["Close"].rolling(window=10).mean()
    data["SMA_20"] = data["Close"].rolling(window=20).mean()
    data["EMA_10"] = data["Close"].ewm(span=10, adjust=False).mean()
    data["EMA_20"] = data["Close"].ewm(span=20, adjust=False).mean()

    delta = data["Close"].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss.replace(0, 1e-9)
    data["RSI"] = 100.0 - (100.0 / (1.0 + rs))

    ema_12 = data["Close"].ewm(span=12, adjust=False).mean()
    ema_26 = data["Close"].ewm(span=26, adjust=False).mean()
    data["MACD"] = ema_12 - ema_26
    data["MACD_Signal"] = data["MACD"].ewm(span=9, adjust=False).mean()

    data["BB_Middle"] = data["SMA_20"]
    bb_std = data["Close"].rolling(window=20).std()
    data["BB_Upper"] = data["BB_Middle"] + (2.0 * bb_std)
    data["BB_Lower"] = data["BB_Middle"] - (2.0 * bb_std)

    data = data.dropna(subset=CE2_FEATURE_COLUMNS).copy()
    return data, "built_in_canonical_fallback (awaiting Colab feature_engineering.py)", False
