import {
  getMarketOverview as fetchMarketOverview,
  getStockHistory,
  getStockSummary,
} from '../services/yahooService.js';
import { computeIndicatorsFromCandles } from '../services/indicatorService.js';
import { isCE2SupportedSymbol } from '../services/ce2ArtifactService.js';
import { generatePrediction } from '../services/predictionService.js';
import { getAllStocks } from '../utils/stockUniverse.js';

let screenerCache = null;
let screenerCacheTime = 0;
const SCREENER_CACHE_TTL = 120 * 1000;

export const getMarketOverview = async (req, res, next) => {
  try {
    const overview = await fetchMarketOverview();
    res.status(200).json(overview);
  } catch (err) {
    next(err);
  }
};

export const getScreener = async (req, res, next) => {
  try {
    const now = Date.now();
    if (screenerCache && now - screenerCacheTime < SCREENER_CACHE_TTL) {
      return res.status(200).json(screenerCache);
    }

    const stocks = getAllStocks();
    const items = await Promise.all(
      stocks.map(async (meta) => {
        const sym = meta.symbol;
        try {
          const [summary, history] = await Promise.all([
            getStockSummary(sym),
            getStockHistory(sym, '3M'),
          ]);

          const hasEnoughCandles = Array.isArray(history) && history.length >= 15;
          const indicators = hasEnoughCandles ? computeIndicatorsFromCandles(history) : null;

          let aiPredictionPct = 'N/A';
          let signal = 'UNVERIFIED';
          let mlVerified = false;

          if (isCE2SupportedSymbol(sym)) {
            const pred = await generatePrediction(sym);
            if (pred.ml_verified && pred.predicted_change_percent !== null) {
              aiPredictionPct = String(pred.predicted_change_percent);
              signal = pred.signal || 'HOLD';
              mlVerified = true;
            }
          }

          return {
            symbol: sym,
            name: meta.name,
            price: summary.price,
            changePercent: summary.changePercent,
            volume: summary.volume || 'N/A',
            marketCap: summary.marketCap || 'N/A',
            rsi: indicators?.rsi?.value != null ? String(indicators.rsi.value) : 'N/A',
            macdSignal: indicators?.macd?.signal || 'N/A',
            aiPredictionPct,
            signal,
            mlVerified,
            sector: meta.sector,
            exchange: meta.exchange,
            market: meta.market,
          };
        } catch {
          return {
            symbol: sym,
            name: meta.name,
            price: null,
            changePercent: null,
            volume: 'N/A',
            marketCap: 'N/A',
            rsi: 'N/A',
            macdSignal: 'N/A',
            aiPredictionPct: 'N/A',
            signal: 'UNVERIFIED',
            mlVerified: false,
            sector: meta.sector,
            exchange: meta.exchange,
            market: meta.market,
          };
        }
      })
    );

    screenerCache = items;
    screenerCacheTime = Date.now();

    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
};

export default { getMarketOverview, getScreener };
