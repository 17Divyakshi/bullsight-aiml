import axios from 'axios';
import { STOCKS, SUPPORTED_FIVE_STOCKS } from '../data/stocks';

const API = axios.create({
  baseURL: '/api',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const UNAVAILABLE_MESSAGE = 'Live market data or AI prediction is currently unavailable.';

export const stockAPI = {
  async getCatalog() {
    try {
      const res = await API.get('/stocks');
      return Array.isArray(res.data) && res.data.length ? res.data : STOCKS;
    } catch {
      return STOCKS;
    }
  },

  async searchCatalog(q) {
    try {
      const res = await API.get('/stocks/search', { params: { q } });
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      const lower = String(q || '').toLowerCase();
      return STOCKS.filter(
        s =>
          s.symbol.toLowerCase().includes(lower) ||
          s.name.toLowerCase().includes(lower)
      );
    }
  },

  async getSummary(symbol) {
    try {
      const res = await API.get(`/stocks/${encodeURIComponent(symbol)}`);
      const data = res.data || {};
      const isLive = Boolean(data.isLive && data.price !== null && data.price !== undefined);
      return {
        ...data,
        available: isLive,
        isLive,
        message: isLive ? undefined : UNAVAILABLE_MESSAGE,
      };
    } catch {
      return {
        symbol,
        name: symbol,
        price: null,
        change: null,
        changePercent: null,
        volume: 'N/A',
        high: null,
        low: null,
        openPrice: null,
        marketCap: 'N/A',
        peRatio: null,
        lastObservedDate: null,
        fetchedAt: null,
        isLive: false,
        available: false,
        message: UNAVAILABLE_MESSAGE,
      };
    }
  },

  async getHistory(symbol, timeframe = '3M') {
    try {
      const res = await API.get(`/stocks/${encodeURIComponent(symbol)}/history`, {
        params: { timeframe },
      });
      const rows = Array.isArray(res.data?.history)
        ? res.data.history
        : Array.isArray(res.data)
          ? res.data
          : [];
      return {
        available: rows.length > 0,
        history: rows,
        message: rows.length > 0 ? undefined : UNAVAILABLE_MESSAGE,
      };
    } catch {
      return {
        available: false,
        history: [],
        message: UNAVAILABLE_MESSAGE,
      };
    }
  },

  async getIndicators(symbol) {
    try {
      const res = await API.get(`/stocks/${encodeURIComponent(symbol)}/indicators`);
      const data = res.data || {};
      const hasAny = Boolean(
        data.rsi?.value !== null && data.rsi?.value !== undefined ||
        data.sma20?.value !== null && data.sma20?.value !== undefined
      );
      return {
        ...data,
        available: hasAny,
        message: hasAny ? undefined : UNAVAILABLE_MESSAGE,
      };
    } catch {
      return {
        symbol,
        available: false,
        message: UNAVAILABLE_MESSAGE,
      };
    }
  },

  async getPrediction(symbol, { buyThreshold, sellThreshold } = {}) {
    try {
      const params = {};
      if (buyThreshold !== undefined && buyThreshold !== null && buyThreshold !== '') {
        params.buy_threshold = buyThreshold;
      }
      if (sellThreshold !== undefined && sellThreshold !== null && sellThreshold !== '') {
        params.sell_threshold = sellThreshold;
      }
      const res = await API.get(`/stocks/${encodeURIComponent(symbol)}/prediction`, { params });
      return res.data;
    } catch {
      return {
        symbol,
        supported: SUPPORTED_FIVE_STOCKS.some(s => s.symbol === String(symbol).toUpperCase()),
        last_observed_date: null,
        last_observed_close: null,
        predicted_next_close: null,
        predicted_change_percent: null,
        selected_model: null,
        signal: null,
        trend: null,
        signal_thresholds: {
          buy_gt_pct: Number(buyThreshold ?? 1.0),
          sell_lt_pct: Number(sellThreshold ?? -1.0),
        },
        signal_disclaimer: 'Experimental educational signal only. Not financial advice.',
        ml_verified: false,
        verification_status: 'service_unavailable',
        training_cutoff_date: null,
        data_freshness: null,
        message: UNAVAILABLE_MESSAGE,
      };
    }
  },

  async getMarketOverview() {
    try {
      const res = await API.get('/market/overview');
      const items = Array.isArray(res.data) ? res.data : [];
      return {
        available: items.length > 0,
        items,
        message: items.length > 0 ? undefined : UNAVAILABLE_MESSAGE,
      };
    } catch {
      return {
        available: false,
        items: [],
        message: UNAVAILABLE_MESSAGE,
      };
    }
  },

  async getScreener(filters = {}) {
    try {
      const res = await API.get('/screener', { params: filters });
      const items = Array.isArray(res.data) ? res.data : [];
      return {
        available: items.length > 0,
        items,
        message: items.length > 0 ? undefined : UNAVAILABLE_MESSAGE,
      };
    } catch {
      return {
        available: false,
        items: [],
        message: UNAVAILABLE_MESSAGE,
      };
    }
  },

  async getNews(symbol = 'ALL') {
    try {
      const res = await API.get(`/news/${encodeURIComponent(symbol)}`);
      const data = res.data || {};
      const articles = Array.isArray(data.articles) ? data.articles : [];
      return {
        available: articles.length > 0,
        configured: Boolean(data.configured),
        message: data.message,
        articles,
      };
    } catch {
      return {
        available: false,
        configured: false,
        articles: [],
        message: 'Market news feed is currently unavailable.',
      };
    }
  },

  async askAIChat(message, contextSymbol = '^NSEI') {
    try {
      const res = await API.post('/ai/chat', {
        message,
        context_symbol: contextSymbol,
      });
      return {
        available: true,
        ...res.data,
      };
    } catch {
      return {
        available: false,
        reply: UNAVAILABLE_MESSAGE,
        sources: [],
      };
    }
  },

  async getModelMetrics(symbol = null) {
    try {
      const params = symbol ? { symbol } : {};
      const res = await API.get('/model/metrics', { params });
      return res.data;
    } catch {
      return {
        ml_verified: false,
        artifacts_available: false,
        models: [],
        test_predictions: [],
        feature_importance: [],
        lstm_history: [],
        plots: [],
        message: 'Model evaluation metrics are currently unavailable from the backend.',
      };
    }
  },

  async getModelStatus() {
    try {
      const res = await API.get('/ce2/status');
      return { available: true, ...res.data };
    } catch {
      return { available: false, ready_count: 0, total_supported: 5, stocks_status: [] };
    }
  },

  async getSystemStatus() {
    try {
      const res = await API.get('/system/status', { timeout: 6500 });
      return {
        reachable: true,
        ...res.data,
      };
    } catch {
      return {
        reachable: false,
        checked_at: new Date().toISOString(),
        express_api: { online: false, uptime_seconds: null },
        market_feed: { online: false, latency_ms: null },
        fastapi_ml: { online: false, latency_ms: null },
        artifacts: { ready_count: 0, total_supported: 5, evaluation_csv_available: false, backtesting_csv_available: false },
        database: { connected: false, mode: 'Offline' },
      };
    }
  },

  async getWatchlist() {
    try {
      const res = await API.get('/user/watchlist');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      try {
        const saved = localStorage.getItem('bullsight_watchlist');
        return saved ? JSON.parse(saved) : SUPPORTED_FIVE_STOCKS.map(s => s.symbol);
      } catch {
        return SUPPORTED_FIVE_STOCKS.map(s => s.symbol);
      }
    }
  },

  async addToWatchlist(symbol) {
    try {
      const res = await API.post('/user/watchlist', { symbol });
      return res.data;
    } catch {
      return { status: 'local', symbol };
    }
  },

  async deleteFromWatchlist(symbol) {
    try {
      const res = await API.delete(`/user/watchlist/${encodeURIComponent(symbol)}`);
      return res.data;
    } catch {
      return { status: 'local', symbol };
    }
  },

  async getPortfolio() {
    try {
      const res = await API.get('/user/portfolio');
      return Array.isArray(res.data) ? res.data : [];
    } catch {
      try {
        const saved = localStorage.getItem('bullsight_portfolio');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
  },

  async addHolding(holdingData) {
    try {
      const res = await API.post('/user/portfolio', holdingData);
      return res.data;
    } catch {
      return { status: 'local', holding: holdingData };
    }
  },

  async deleteHolding(identifier) {
    try {
      const res = await API.delete(`/user/portfolio/${encodeURIComponent(identifier)}`);
      return res.data;
    } catch {
      return { status: 'local', identifier };
    }
  },

  async getPortfolioAnalytics() {
    try {
      const res = await API.get('/user/portfolio/analytics');
      return res.data;
    } catch {
      return null;
    }
  },

  async getBacktesting(symbol = '^NSEI') {
    try {
      const res = await API.get('/backtesting', { params: { symbol } });
      return res.data;
    } catch {
      return {
        available: false,
        ml_verified: false,
        symbol,
        rows: [],
        summary: {},
        message: 'Strategy backtesting results are currently unavailable from the active backend.',
      };
    }
  },
};
