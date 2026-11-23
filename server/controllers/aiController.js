import { processAIChat } from '../services/aiService.js';
import {
  pingPythonMLService,
  queryPythonBacktesting,
  queryPythonCE2Status,
  queryPythonModelMetrics,
} from '../services/mlProxyService.js';
import {
  getCE2OverallStatus,
  getExportedBacktestingData,
  getExportedEvaluationData,
  resolvePlotFile,
} from '../services/ce2ArtifactService.js';
import { getStockSummary } from '../services/yahooService.js';
import { isDBConnected } from '../config/db.js';

export const aiChat = async (req, res, next) => {
  try {
    const { message, context_symbol } = req.body;
    if (!message) {
      return res.status(400).json({ error: { message: 'Message text is required' } });
    }

    const reply = await processAIChat(message, context_symbol || '^NSEI');
    res.status(200).json(reply);
  } catch (err) {
    next(err);
  }
};

export const getModelMetrics = async (req, res, next) => {
  try {
    const symbol = req.query.symbol || null;
    const pythonRes = await queryPythonModelMetrics(symbol);
    if (pythonRes.success && pythonRes.data) {
      return res.status(200).json(pythonRes.data);
    }
    return res.status(200).json(getExportedEvaluationData(symbol));
  } catch (err) {
    next(err);
  }
};

export const getBacktesting = async (req, res, next) => {
  try {
    const symbol = req.query.symbol || null;
    const pythonRes = await queryPythonBacktesting(symbol);
    if (pythonRes.success && pythonRes.data) {
      return res.status(200).json(pythonRes.data);
    }
    return res.status(200).json(getExportedBacktestingData(symbol));
  } catch (err) {
    next(err);
  }
};

export const getCE2Status = async (req, res, next) => {
  try {
    const pythonRes = await queryPythonCE2Status();
    if (pythonRes.success && pythonRes.data) {
      return res.status(200).json(pythonRes.data);
    }
    return res.status(200).json(getCE2OverallStatus());
  } catch (err) {
    next(err);
  }
};

export const getCE2Plot = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const resolved = resolvePlotFile(filename);
    if (!resolved) {
      return res.status(404).json({ error: { message: 'Requested plot image not found.' } });
    }
    return res.sendFile(resolved);
  } catch (err) {
    next(err);
  }
};

export const getSystemStatus = async (req, res, next) => {
  try {
    const marketStarted = Date.now();
    const [pythonPing, marketCheck] = await Promise.all([
      pingPythonMLService(),
      getStockSummary('^NSEI').catch(() => null),
    ]);
    const marketLatency = Date.now() - marketStarted;
    const artifacts = getCE2OverallStatus();

    return res.status(200).json({
      checked_at: new Date().toISOString(),
      express_api: {
        online: true,
        uptime_seconds: Math.floor(process.uptime()),
      },
      market_feed: {
        online: Boolean(marketCheck?.isLive && marketCheck?.price != null),
        latency_ms: marketCheck?.isLive ? marketLatency : null,
        sample_symbol: '^NSEI',
        last_observed_price: marketCheck?.isLive ? marketCheck.price : null,
        last_observed_date: marketCheck?.lastObservedDate || null,
      },
      fastapi_ml: {
        online: Boolean(pythonPing?.online),
        latency_ms: pythonPing?.latency_ms ?? null,
      },
      artifacts: {
        ready_count: artifacts.ready_count,
        total_supported: artifacts.total_supported,
        evaluation_csv_available: artifacts.evaluation_csv_available,
        backtesting_csv_available: artifacts.backtesting_csv_available,
        export_dir_exists: artifacts.export_dir_exists,
      },
      database: {
        connected: isDBConnected(),
        mode: isDBConnected() ? 'MongoDB' : 'In-Memory Store',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const trainModel = async (req, res) => {
  return res.status(400).json({
    error: {
      message:
        'In-app retraining is disabled for CE-2. Models are trained externally in Google Colab and loaded from CE2_EXPORT_DIR.',
    },
  });
};

export default {
  aiChat,
  getModelMetrics,
  getBacktesting,
  getCE2Status,
  getCE2Plot,
  getSystemStatus,
  trainModel,
};
