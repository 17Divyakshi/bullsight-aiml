from pydantic import BaseModel, Field
from typing import List, Optional

class StockSummaryResponse(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    changePercent: float
    volume: str
    high: float
    low: float
    marketCap: str
    peRatio: Optional[float] = None
    openPrice: float

class PricePoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    sma20: Optional[float] = None
    sma50: Optional[float] = None

class StockHistoryResponse(BaseModel):
    symbol: str
    timeframe: str
    history: List[PricePoint]

class IndicatorValue(BaseModel):
    value: Optional[float] = None
    signal: str

class BollingerValue(BaseModel):
    middle: Optional[float] = None
    upper: Optional[float] = None
    lower: Optional[float] = None
    position: Optional[float] = None
    signal: str

class StockIndicatorsResponse(BaseModel):
    symbol: str
    rsi: IndicatorValue
    macd: dict
    sma20: IndicatorValue
    ema20: IndicatorValue
    bollinger: BollingerValue

class StockPredictionResponse(BaseModel):
    symbol: str
    stock_name: Optional[str] = None
    supported: bool = True
    supported_symbols: Optional[List[str]] = None
    last_observed_date: Optional[str] = None
    last_observed_close: Optional[float] = None
    predicted_next_close: Optional[float] = None
    predicted_change_percent: Optional[float] = None
    selected_model: Optional[str] = None
    signal: Optional[str] = None
    trend: Optional[str] = None
    signal_thresholds: dict = Field(default_factory=lambda: {"buy_gt_pct": 1.0, "sell_lt_pct": -1.0})
    signal_disclaimer: str = "Experimental AI-generated signal for educational purposes only. Not financial advice."
    ml_verified: bool = False
    verification_status: str = "unverified"
    training_cutoff_date: Optional[str] = None
    feature_engineering_source: Optional[str] = None
    feature_count: Optional[int] = None
    data_freshness: Optional[dict] = None
    expected_artifact_dir: Optional[str] = None
    missing_artifacts: List[str] = Field(default_factory=list)
    message: Optional[str] = None

class MarketIndexItem(BaseModel):
    name: str
    value: str
    change: str
    changePercent: str
    isPositive: bool

class ScreenerItem(BaseModel):
    symbol: str
    name: str
    price: Optional[float] = None
    changePercent: Optional[float] = None
    volume: str
    marketCap: str
    rsi: str
    macdSignal: str
    aiPredictionPct: str
    signal: str
    mlVerified: bool = False
    sector: Optional[str] = None
    exchange: Optional[str] = None
    market: Optional[str] = None

class NewsArticle(BaseModel):
    id: str
    title: str
    source: str
    time: str
    sentiment: str
    sentimentScore: float
    symbol: Optional[str] = None
    url: Optional[str] = None

class NewsResponse(BaseModel):
    configured: bool
    message: str
    articles: List[NewsArticle]

class AIChatRequest(BaseModel):
    message: str
    context_symbol: Optional[str] = "^NSEI"

class AIChatResponse(BaseModel):
    reply: str
    sources: List[str]
    isFallback: bool

class ModelMetricsResponse(BaseModel):
    ml_verified: bool
    artifacts_available: bool
    export_dir: str
    symbol: Optional[str] = None
    selected_model: Optional[str] = None
    selection_criterion: str
    models: List[dict] = Field(default_factory=list)
    test_predictions: List[dict] = Field(default_factory=list)
    feature_importance: List[dict] = Field(default_factory=list)
    lstm_history: List[dict] = Field(default_factory=list)
    plots: List[str] = Field(default_factory=list)
    sources: dict = Field(default_factory=dict)
    message: str

class SettingsRequest(BaseModel):
    news_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None

class SettingsResponse(BaseModel):
    news_api_configured: bool
    news_api_key_masked: Optional[str] = None
    openai_api_configured: bool
    openai_api_key_masked: Optional[str] = None
    ce2_export_dir: Optional[str] = None
    signal_buy_threshold_pct: float = 1.0
    signal_sell_threshold_pct: float = -1.0
