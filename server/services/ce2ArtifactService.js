/**
 * CE-2 Artifact Service (Node.js)
 *
 * Inspects CE2_EXPORT_DIR (default: backend/ce2_export) for Colab-exported
 * metadata, stock models, scalers, evaluation CSVs, backtesting CSVs, and PNG plots.
 * Never fabricates models, metrics, predictions, or backtesting curves.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CE2_STOCKS, CE2_SUPPORTED_SYMBOLS } from '../utils/stockUniverse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_EXPORT_DIR = path.resolve(__dirname, '../../backend/ce2_export');

export function getExportDir() {
  return path.resolve(process.env.CE2_EXPORT_DIR || DEFAULT_EXPORT_DIR);
}

export function sanitizeSymbol(symbol = '') {
  return String(symbol).toUpperCase().trim();
}

export function isCE2SupportedSymbol(symbol = '') {
  return CE2_SUPPORTED_SYMBOLS.includes(sanitizeSymbol(symbol));
}

function symbolFolderCandidates(symbol) {
  const sym = sanitizeSymbol(symbol);
  const noCaret = sym.replace(/\^/g, '');
  const underscored = noCaret.replace(/[.\-]/g, '_');
  return [...new Set([underscored, noCaret, sym, sym.toLowerCase(), underscored.toLowerCase()])];
}

function safeResolveInside(baseDir, targetPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  if (resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep)) {
    return resolvedTarget;
  }
  return null;
}

function findFirstExisting(baseDir, candidates) {
  for (const rel of candidates) {
    const candidate = safeResolveInside(baseDir, path.join(baseDir, rel));
    if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function findStockDir(exportDir, symbol) {
  const candidates = symbolFolderCandidates(symbol);
  const roots = [exportDir, path.join(exportDir, 'models'), path.join(exportDir, 'artifacts')];
  for (const root of roots) {
    for (const folderName of candidates) {
      const candidate = safeResolveInside(exportDir, path.join(root, folderName));
      if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return candidate;
      }
    }
  }
  return null;
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function coerceValue(raw) {
  if (raw === '' || raw === null || raw === undefined) return null;
  if (raw === 'True' || raw === 'true') return true;
  if (raw === 'False' || raw === 'false') return false;
  const num = Number(raw);
  if (!Number.isNaN(num) && raw !== '') return num;
  return raw;
}

function readCsvRecords(filenameCandidates, symbol = null) {
  const exportDir = getExportDir();
  const csvPath = findFirstExisting(exportDir, filenameCandidates);
  if (!csvPath) {
    return { available: false, path: null, rows: [] };
  }

  try {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return { available: false, path: csvPath, rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    let rows = lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = coerceValue(values[idx]);
      });
      return obj;
    });

    if (symbol && rows.length > 0) {
      const symClean = sanitizeSymbol(symbol);
      const symCol = headers.find((h) => ['symbol', 'ticker', 'stock'].includes(h.toLowerCase()));
      if (symCol) {
        const filtered = rows.filter((r) => sanitizeSymbol(r[symCol]) === symClean);
        if (filtered.length > 0) rows = filtered;
      }
    }

    return { available: rows.length > 0, path: csvPath, rows };
  } catch (err) {
    return { available: false, path: csvPath, error: err.message, rows: [] };
  }
}

export function getStockMetadata(symbol) {
  const exportDir = getExportDir();
  const sym = sanitizeSymbol(symbol);
  const stockDir = findStockDir(exportDir, sym);

  if (stockDir) {
    const metaPath = findFirstExisting(stockDir, ['metadata.json', 'model_metadata.json']);
    if (metaPath) {
      try {
        return { found: true, path: metaPath, data: JSON.parse(fs.readFileSync(metaPath, 'utf-8')) };
      } catch {
        // ignore parse error
      }
    }
  }

  const globalMeta = findFirstExisting(exportDir, ['metadata.json', 'models_metadata.json']);
  if (globalMeta) {
    try {
      const allMeta = JSON.parse(fs.readFileSync(globalMeta, 'utf-8'));
      for (const key of [sym, ...symbolFolderCandidates(sym)]) {
        if (allMeta && typeof allMeta[key] === 'object') {
          return { found: true, path: globalMeta, data: allMeta[key] };
        }
      }
    } catch {
      // ignore parse error
    }
  }

  return { found: false, path: null, data: {} };
}

export function inspectStockArtifacts(symbol) {
  const exportDir = getExportDir();
  const sym = sanitizeSymbol(symbol);
  const stockDir = findStockDir(exportDir, sym);
  const metaInfo = getStockMetadata(sym);
  const meta = metaInfo.data || {};
  const safeTag = symbolFolderCandidates(sym)[0];

  const missing = [];
  const foundFiles = {};

  const fePath = findFirstExisting(exportDir, ['feature_engineering.py']);
  if (fePath) foundFiles.feature_engineering = fePath;
  else missing.push(`${exportDir}/feature_engineering.py`);

  if (metaInfo.found) foundFiles.metadata = metaInfo.path;
  else missing.push(`${exportDir}/models/${safeTag}/metadata.json`);

  const searchBase = stockDir || exportDir;
  const lrPath = findFirstExisting(searchBase, ['linear_regression.joblib', 'linear_regression.pkl', `${safeTag}_linear_regression.joblib`, `${safeTag}_lr.pkl`]);
  const rfPath = findFirstExisting(searchBase, ['random_forest.joblib', 'random_forest.pkl', `${safeTag}_random_forest.joblib`, `${safeTag}_rf.pkl`]);
  const lstmPath = findFirstExisting(searchBase, ['lstm_model.keras', 'lstm.keras', 'lstm_model.h5', `${safeTag}_lstm.keras`]);
  const featScalerPath = findFirstExisting(searchBase, ['feature_scaler.joblib', 'feature_scaler.pkl', 'scaler_X.pkl', 'scaler_x.joblib', 'x_scaler.pkl']);
  const targetScalerPath = findFirstExisting(searchBase, ['target_scaler.joblib', 'target_scaler.pkl', 'scaler_y.pkl', 'scaler_y.joblib', 'y_scaler.pkl']);

  if (lrPath) foundFiles.linear_regression = lrPath;
  if (rfPath) foundFiles.random_forest = rfPath;
  if (lstmPath) foundFiles.lstm = lstmPath;
  if (featScalerPath) foundFiles.feature_scaler = featScalerPath;
  else missing.push(`${exportDir}/models/${safeTag}/feature_scaler.joblib`);

  if (targetScalerPath) foundFiles.target_scaler = targetScalerPath;
  else missing.push(`${exportDir}/models/${safeTag}/target_scaler.joblib`);

  const selectedModel = String(meta.selected_model || meta.best_model || meta.model_name || '').trim();
  const selLow = selectedModel.toLowerCase();
  const selectedModelFile = selLow.includes('lstm')
    ? lstmPath
    : selLow.includes('forest') || selLow === 'rf'
      ? rfPath
      : selLow.includes('linear') || selLow === 'lr'
        ? lrPath
        : lstmPath || rfPath || lrPath;

  if (!selectedModelFile) {
    missing.push(`${exportDir}/models/${safeTag}/(linear_regression.joblib | random_forest.joblib | lstm_model.keras)`);
  }

  const artifactsReady = Boolean(
    metaInfo.found &&
    selectedModelFile &&
    featScalerPath &&
    (targetScalerPath || !selLow.includes('lstm'))
  );

  return {
    symbol: sym,
    supported: isCE2SupportedSymbol(sym),
    export_dir: exportDir,
    stock_dir: stockDir,
    artifacts_ready: artifactsReady,
    selected_model: selectedModel || null,
    metadata: meta,
    found_files: foundFiles,
    missing_artifacts: missing,
  };
}

export function getExportedEvaluationData(symbol = null) {
  const exportDir = getExportDir();
  const metricsCsv = readCsvRecords(['model_metrics.csv', 'metrics/model_metrics.csv'], symbol);
  const predsCsv = readCsvRecords(['test_predictions.csv', 'metrics/test_predictions.csv'], symbol);
  const fiCsv = readCsvRecords(['feature_importance.csv', 'metrics/feature_importance.csv'], symbol);
  const lossCsv = readCsvRecords(['lstm_history.csv', 'lstm_loss.csv', 'metrics/lstm_history.csv'], symbol);

  const plotsDir = safeResolveInside(exportDir, path.join(exportDir, 'plots'));
  let plots = [];
  if (plotsDir && fs.existsSync(plotsDir) && fs.statSync(plotsDir).isDirectory()) {
    plots = fs
      .readdirSync(plotsDir)
      .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
      .sort();
  }

  const metaInfo = symbol ? getStockMetadata(symbol) : { found: false, data: {} };
  const available = Boolean(metricsCsv.available || predsCsv.available);

  return {
    ml_verified: available,
    artifacts_available: available,
    export_dir: exportDir,
    symbol: symbol ? sanitizeSymbol(symbol) : null,
    selected_model: metaInfo.found ? metaInfo.data.selected_model || metaInfo.data.best_model || null : null,
    selection_criterion: 'Lowest validation MAE',
    models: metricsCsv.rows,
    test_predictions: predsCsv.rows,
    feature_importance: fiCsv.rows,
    lstm_history: lossCsv.rows,
    plots,
    sources: {
      model_metrics_csv: metricsCsv.path,
      test_predictions_csv: predsCsv.path,
      feature_importance_csv: fiCsv.path,
      lstm_history_csv: lossCsv.path,
    },
    message: available
      ? 'Loaded exported Google Colab evaluation results.'
      : `Exported Colab evaluation CSVs (model_metrics.csv, test_predictions.csv) were not found in ${exportDir}.`,
  };
}

export function getExportedBacktestingData(symbol = null) {
  const exportDir = getExportDir();
  const btCsv = readCsvRecords(
    ['backtesting_results.csv', 'backtest_results.csv', 'metrics/backtesting_results.csv'],
    symbol
  );
  const summaryPath = findFirstExisting(exportDir, ['backtesting_summary.json', 'metrics/backtesting_summary.json']);
  let summaryData = {};
  if (summaryPath) {
    try {
      summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    } catch {
      summaryData = {};
    }
  }

  return {
    available: btCsv.available,
    ml_verified: btCsv.available,
    export_dir: exportDir,
    symbol: symbol ? sanitizeSymbol(symbol) : null,
    execution_rule: 'Next-session Open entry and same-session Close exit',
    summary: summaryData,
    rows: btCsv.rows,
    source_file: btCsv.path,
    message: btCsv.available
      ? 'Loaded exported Google Colab backtesting results.'
      : `Exported backtesting_results.csv was not found in ${exportDir}. Backtesting figures are unavailable until Colab artifacts are placed.`,
  };
}

export function getCE2OverallStatus() {
  const exportDir = getExportDir();
  const stocksStatus = CE2_STOCKS.map((s) => inspectStockArtifacts(s.symbol));
  const evalData = getExportedEvaluationData();
  const btData = getExportedBacktestingData();

  return {
    export_dir: exportDir,
    export_dir_exists: fs.existsSync(exportDir) && fs.statSync(exportDir).isDirectory(),
    supported_stocks: CE2_STOCKS,
    stocks_status: stocksStatus,
    ready_count: stocksStatus.filter((item) => item.artifacts_ready).length,
    total_supported: stocksStatus.length,
    evaluation_csv_available: evalData.artifacts_available,
    backtesting_csv_available: btData.available,
  };
}

export function resolvePlotFile(filename) {
  const exportDir = getExportDir();
  const plotsDir = path.resolve(exportDir, 'plots');
  const safeName = path.basename(String(filename || ''));
  const candidate = path.resolve(plotsDir, safeName);
  if (
    candidate.startsWith(plotsDir + path.sep) &&
    fs.existsSync(candidate) &&
    fs.statSync(candidate).isFile()
  ) {
    return candidate;
  }
  return null;
}
