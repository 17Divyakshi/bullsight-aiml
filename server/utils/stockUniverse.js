/**
 * BullSight Stock Universe Catalog
 * Curated equities across US Tech, Blue Chips, Indian NIFTY 50 (NSE), and Global ETFs/Cryptos.
 */

export const STOCKS_CATALOG = [
  // US Tech Giants & Growth
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Technology',
    currency: 'USD',
    basePrice: 245.80,
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
    basePrice: 428.50,
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
    basePrice: 142.20,
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
    basePrice: 182.30,
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
    basePrice: 198.40,
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
    basePrice: 585.60,
    isPopular: true,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Automotive / AI',
    currency: 'USD',
    basePrice: 218.90,
    isPopular: true,
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Semiconductors',
    currency: 'USD',
    basePrice: 156.40,
    isPopular: false,
  },
  {
    symbol: 'INTC',
    name: 'Intel Corporation',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Semiconductors',
    currency: 'USD',
    basePrice: 22.80,
    isPopular: false,
  },

  // Indian Index Benchmark
  {
    symbol: '^NSEI',
    name: 'NIFTY 50 Index',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Benchmark Index',
    currency: 'PTS',
    basePrice: null,
    isPopular: true,
    isCE2: true,
  },

  // Indian NIFTY 50 Blue Chips (NSE)
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd.',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Conglomerate / Energy',
    currency: 'INR',
    basePrice: null,
    isPopular: true,
    isCE2: true,
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Information Technology',
    currency: 'INR',
    basePrice: null,
    isPopular: true,
    isCE2: true,
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Limited',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Information Technology',
    currency: 'INR',
    basePrice: null,
    isPopular: true,
    isCE2: true,
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Limited',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Banking & Financials',
    currency: 'INR',
    basePrice: null,
    isPopular: true,
    isCE2: true,
  },
  {
    symbol: 'ICICIBANK.NS',
    name: 'ICICI Bank Limited',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Banking & Financials',
    currency: 'INR',
    basePrice: null,
    isPopular: false,
  },
  {
    symbol: 'TATAMOTORS.NS',
    name: 'Tata Motors Limited',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Automotive',
    currency: 'INR',
    basePrice: null,
    isPopular: true,
  },
  {
    symbol: 'SBIN.NS',
    name: 'State Bank of India',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Public Sector Banking',
    currency: 'INR',
    basePrice: null,
    isPopular: false,
  },
  {
    symbol: 'BHARTIARTL.NS',
    name: 'Bharti Airtel Limited',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Telecommunications',
    currency: 'INR',
    basePrice: null,
    isPopular: false,
  },
  {
    symbol: 'WIPRO.NS',
    name: 'Wipro Limited',
    exchange: 'NSE',
    market: 'IN',
    country: 'IN',
    sector: 'Information Technology',
    currency: 'INR',
    basePrice: null,
    isPopular: false,
  },

  // US Blue Chips, Finance, Healthcare
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    exchange: 'NYSE',
    market: 'US',
    country: 'US',
    sector: 'Banking & Finance',
    currency: 'USD',
    basePrice: null,
    isPopular: false,
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    exchange: 'NYSE',
    market: 'US',
    country: 'US',
    sector: 'Financial Technology',
    currency: 'USD',
    basePrice: null,
    isPopular: false,
  },
  {
    symbol: 'WMT',
    name: 'Walmart Inc.',
    exchange: 'NYSE',
    market: 'US',
    country: 'US',
    sector: 'Consumer Staples',
    currency: 'USD',
    basePrice: null,
    isPopular: false,
  },

  // ETFs & Cryptocurrencies
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSE Arca',
    market: 'US',
    country: 'US',
    sector: 'Index ETF',
    currency: 'USD',
    basePrice: null,
    isPopular: true,
  },
  {
    symbol: 'QQQ',
    name: 'Invesco QQQ (Nasdaq-100 ETF)',
    exchange: 'NASDAQ',
    market: 'US',
    country: 'US',
    sector: 'Technology ETF',
    currency: 'USD',
    basePrice: null,
    isPopular: true,
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin USD',
    exchange: 'Crypto',
    market: 'CRYPTO',
    country: 'GLOBAL',
    sector: 'Digital Asset',
    currency: 'USD',
    basePrice: null,
    isPopular: true,
  },
  {
    symbol: 'ETH-USD',
    name: 'Ethereum USD',
    exchange: 'Crypto',
    market: 'CRYPTO',
    country: 'GLOBAL',
    sector: 'Smart Contracts',
    currency: 'USD',
    basePrice: null,
    isPopular: false,
  },
];

export const CE2_SUPPORTED_SYMBOLS = [
  '^NSEI',
  'RELIANCE.NS',
  'TCS.NS',
  'INFY.NS',
  'HDFCBANK.NS',
];

export const CE2_STOCKS = CE2_SUPPORTED_SYMBOLS.map((sym) =>
  STOCKS_CATALOG.find((s) => s.symbol === sym)
).filter(Boolean);

export const getAllStocks = () => STOCKS_CATALOG;

export const searchStocks = (query = '') => {
  if (!query) return STOCKS_CATALOG;
  const q = query.toLowerCase().trim();
  return STOCKS_CATALOG.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
  );
};

export const getStockBySymbol = (symbol = '') => {
  const sym = symbol.toUpperCase().trim();
  const isNse = sym === '^NSEI' || sym.endsWith('.NS') || sym.endsWith('.BO');
  return (
    STOCKS_CATALOG.find((s) => s.symbol.toUpperCase() === sym) || {
      symbol: sym,
      name: sym === '^NSEI' ? 'NIFTY 50 Index' : `${sym} Equity`,
      exchange: isNse ? 'NSE' : 'NASDAQ',
      market: isNse ? 'IN' : 'US',
      country: isNse ? 'IN' : 'US',
      sector: 'General Equities',
      currency: sym === '^NSEI' ? 'PTS' : isNse ? 'INR' : 'USD',
      basePrice: null,
      isPopular: false,
    }
  );
};
