import { getStockSummary } from './yahooService.js';
import { queryPythonMLService } from './mlProxyService.js';
import {
  inspectStockArtifacts,
  isCE2SupportedSymbol,
  sanitizeSymbol,
} from './ce2ArtifactService.js';
import { CE2_SUPPORTED_SYMBOLS, getStockBySymbol } from '../utils/stockUniverse.js';
import PredictionRecord from '../models/PredictionRecord.js';
import { isDBConnected } from '../config/db.js';

export const mockPredictionHistory = [];

export const SIGNAL_DISCLAIMER =
  'Experimental AI-generated signal for educational purposes only. Not financial advice.';

/**
 * Generates next-session closing-price predictions via Python FastAPI ML inference.
 * Never fabricates predicted prices, multi-day forecasts, or fake confidence scores
 * when the FastAPI ML service is offline or Colab artifacts are missing.
 */
export async function generatePrediction(
  symbol = '^NSEI',
  { buyThreshold, sellThreshold } = {}
) {
  const sym = sanitizeSymbol(symbol);
  const buyThr = Number.isFinite(Number(buyThreshold))
    ? Number(buyThreshold)
    : Number(process.env.SIGNAL_BUY_THRESHOLD_PCT || 1.0);
  const sellThr = Number.isFinite(Number(sellThreshold))
    ? Number(sellThreshold)
    : Number(process.env.SIGNAL_SELL_THRESHOLD_PCT || -1.0);
  const thresholds = { buy_gt_pct: buyThr, sell_lt_pct: sellThr };

  const stockMeta = getStockBySymbol(sym);

  // 1. Try FastAPI ML inference service (which loads real Colab .keras/.joblib/scalers)
  const pythonResult = await queryPythonMLService(sym, {
    buyThreshold: buyThr,
    sellThreshold: sellThr,
  });

  if (pythonResult.success && pythonResult.data) {
    const data = pythonResult.data;
    if (data.ml_verified) {
      const recordPayload = {
        symbol: sym,
        currentPrice: data.last_observed_close,
        predictedPrice: data.predicted_next_close,
        changePercent: data.predicted_change_percent,
        trend: data.trend,
        signal: data.signal,
        modelName: data.selected_model,
        horizonDays: 1,
      };
      if (isDBConnected()) {
        try {
          await PredictionRecord.create(recordPayload);
        } catch (dbErr) {
          console.warn(`[Prediction DB Save] ${dbErr.message}`);
        }
      } else {
        mockPredictionHistory.unshift({ ...recordPayload, createdAt: new Date().toISOString() });
        if (mockPredictionHistory.length > 100) mockPredictionHistory.pop();
      }
    }
    return data;
  }

  // 2. If FastAPI is not running in this runtime, check symbol support + real artifacts + real Yahoo quote
  if (!isCE2SupportedSymbol(sym)) {
    return {
      symbol: sym,
      stock_name: stockMeta.name,
      supported: false,
      supported_symbols: CE2_SUPPORTED_SYMBOLS,
      last_observed_date: null,
      last_observed_close: null,
      predicted_next_close: null,
      predicted_change_percent: null,
      selected_model: null,
      signal: null,
      trend: null,
      signal_thresholds: thresholds,
      signal_disclaimer: SIGNAL_DISCLAIMER,
      ml_verified: false,
      verification_status: 'unsupported_symbol',
      training_cutoff_date: null,
      data_freshness: null,
      missing_artifacts: [],
      message: `${sym} is outside the 5 supported ML assets (${CE2_SUPPORTED_SYMBOLS.join(', ')}).`,
    };
  }

  const [artifactStatus, summary] = await Promise.all([
    Promise.resolve(inspectStockArtifacts(sym)),
    getStockSummary(sym),
  ]);

  const meta = artifactStatus.metadata || {};
  const trainingCutoff =
    meta.training_cutoff_date || meta.cutoff_date || meta.train_end_date || null;

  const verificationStatus = artifactStatus.artifacts_ready
    ? 'ml_service_offline'
    : 'unverified_missing_artifacts';

  const message = artifactStatus.artifacts_ready
    ? 'Colab artifacts are present, but the Python FastAPI ML inference service is currently offline. Start FastAPI on PYTHON_ML_SERVICE_URL to run model inference.'
    : 'Trained Google Colab model artifacts for this stock are not placed in CE2_EXPORT_DIR yet. No next-session prediction generated.';

  return {
    symbol: sym,
    stock_name: stockMeta.name,
    supported: true,
    last_observed_date: summary.lastObservedDate || null,
    last_observed_close: summary.isLive ? summary.price : null,
    predicted_next_close: null,
    predicted_change_percent: null,
    selected_model: artifactStatus.selected_model || null,
    signal: null,
    trend: null,
    signal_thresholds: thresholds,
    signal_disclaimer: SIGNAL_DISCLAIMER,
    ml_verified: false,
    verification_status: verificationStatus,
    training_cutoff_date: trainingCutoff,
    data_freshness: {
      fetched_at: summary.fetchedAt,
      last_trading_date: summary.lastObservedDate || null,
      source: 'Yahoo Finance v8 API',
      is_live: Boolean(summary.isLive),
    },
    expected_artifact_dir: artifactStatus.export_dir,
    missing_artifacts: artifactStatus.missing_artifacts || [],
    message,
  };
}
