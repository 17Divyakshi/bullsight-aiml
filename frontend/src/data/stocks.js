// Bullsight Curated Multi-Market Stock Universe

export const SUPPORTED_FIVE_STOCKS = [
  { symbol: '^NSEI', label: 'NIFTY 50 Index', shortLabel: 'NIFTY 50', market: 'NSE India', exchange: 'NSE' },
  { symbol: 'RELIANCE.NS', label: 'Reliance Industries', shortLabel: 'RELIANCE', market: 'NSE India', exchange: 'NSE' },
  { symbol: 'TCS.NS', label: 'Tata Consultancy', shortLabel: 'TCS', market: 'NSE India', exchange: 'NSE' },
  { symbol: 'INFY.NS', label: 'Infosys Limited', shortLabel: 'INFY', market: 'NSE India', exchange: 'NSE' },
  { symbol: 'HDFCBANK.NS', label: 'HDFC Bank', shortLabel: 'HDFCBANK', market: 'NSE India', exchange: 'NSE' },
];

export const FEATURED_FIVE_STOCKS = SUPPORTED_FIVE_STOCKS;
export const CE2_STOCKS = SUPPORTED_FIVE_STOCKS;

export const STOCKS = [
  // Core 5 Supported Indian Benchmark & Equities
  {
    symbol: '^NSEI',
    name: 'NIFTY 50 Index',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Benchmark Index',
    currency: 'PTS',
    isPopular: true,
    isSupportedCore: true,
  },
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Energy & Retail',
    currency: 'INR',
    isPopular: true,
    isSupportedCore: true,
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'IT & Consulting',
    currency: 'INR',
    isPopular: true,
    isSupportedCore: true,
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Limited',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'IT & Consulting',
    currency: 'INR',
    isPopular: true,
    isSupportedCore: true,
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Limited',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Banking & Finance',
    currency: 'INR',
    isPopular: true,
    isSupportedCore: true,
  },

  // Additional NSE India Equities
  {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Limited',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Banking & Finance',
    currency: 'INR',
    isPopular: false,
  },
  {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Banking & Finance',
    currency: 'INR',
    isPopular: false,
  },
  {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Limited',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Telecom Services',
    currency: 'INR',
    isPopular: false,
  },
  {
    symbol: 'ITC.NS',
    name: 'ITC Limited',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Consumer Goods',
    currency: 'INR',
    isPopular: false,
  },
  {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Limited',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'Automotive',
    currency: 'INR',
    isPopular: true,
  },
  {
    symbol: 'WIPRO.NS',
    name: 'Wipro Limited',
    exchange: 'NSE India',
    market: 'INDIAN',
    country: 'IN',
    sector: 'IT Services',
    currency: 'INR',
    isPopular: false,
  },

  // US Tech Giants & Blue Chips
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Technology',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Technology',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Semiconductors',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Technology',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Consumer Discretionary',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Communication Services',
    currency: 'USD',
    isPopular: false,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Automotive & Clean Energy',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    market: 'US',
    country: 'US',
    sector: 'Banking & Finance',
    currency: 'USD',
    isPopular: false,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSE Arca',
    market: 'US',
    country: 'US',
    sector: 'Index ETF',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq 100)',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Index ETF',
    currency: 'USD',
    isPopular: false,
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin USD',
    exchange: 'Crypto',
    market: 'CRYPTO',
    country: 'GLOBAL',
    sector: 'Cryptocurrency',
    currency: 'USD',
    isPopular: true,
  },
  {
    symbol: 'ETH-USD',
    name: 'Ethereum USD',
    exchange: 'Crypto',
    market: 'CRYPTO',
    country: 'GLOBAL',
    sector: 'Cryptocurrency',
    currency: 'USD',
    isPopular: false,
  },
];

export const POPULAR_CHIPS = [
  '^NSEI',
  'RELIANCE.NS',
  'TCS.NS',
  'INFY.NS',
  'HDFCBANK.NS',
  'ICICIBANK.NS',
  'AAPL',
  'NVDA',
  'MSFT',
  'GOOGL',
  'BTC-USD',
  'SPY',
];

export function isSupportedCoreSymbol(symbol = '') {
  const sym = String(symbol).toUpperCase().trim();
  return SUPPORTED_FIVE_STOCKS.some(s => s.symbol === sym);
}

export function getAllStocks() {
  return STOCKS;
}

export function getPopularStocks() {
  return STOCKS.filter(s => s.isPopular);
}

export function getStockBySymbol(symbol) {
  if (!symbol) return null;
  const sym = symbol.toUpperCase().trim();
  return STOCKS.find(s => s.symbol.toUpperCase() === sym) || null;
}

export function searchStocks(query) {
  if (!query) return STOCKS;
  const q = query.trim().toLowerCase();
  return STOCKS.filter(
    s =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
  );
}
