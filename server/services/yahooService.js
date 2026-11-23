import { getStockBySymbol } from '../utils/stockUniverse.js';

const TIMEFRAME_TO_RANGE_MAP = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
  'MAX': { range: 'max', interval: '1mo' },
};

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
};

/**
 * Fetches real-time price summary from Yahoo Finance v8 API.
 * Never fabricates synthetic prices when Yahoo Finance is unreachable.
 */
export async function getStockSummary(symbol) {
  const sym = symbol.toUpperCase().trim();
  const meta = getStockBySymbol(sym);
  const isNse = sym === '^NSEI' || sym.endsWith('.NS') || sym.endsWith('.BO');

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: YF_HEADERS });

    if (res.ok) {
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const m = result?.meta;
      const timestamps = result?.timestamp || [];
      const closes = result?.indicators?.quote?.[0]?.close || [];
      const adjCloses = result?.indicators?.adjclose?.[0]?.adjclose || [];

      if (m) {
        let lastObservedDate = null;
        for (let i = timestamps.length - 1; i >= 0; i--) {
          if (closes[i] !== null && closes[i] !== undefined) {
            lastObservedDate = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            break;
          }
        }
        if (!lastObservedDate && m.regularMarketTime) {
          lastObservedDate = new Date(m.regularMarketTime * 1000).toISOString().split('T')[0];
        }

        const latestAdjClose = adjCloses.filter((v) => v !== null && v !== undefined).pop();
        const price = m.regularMarketPrice != null
          ? Number(m.regularMarketPrice.toFixed(2))
          : latestAdjClose != null
            ? Number(latestAdjClose.toFixed(2))
            : null;

        const prevClose = m.chartPreviousClose ?? m.previousClose ?? price;
        const change = price != null && prevClose != null ? Number((price - prevClose).toFixed(2)) : null;
        const changePercent =
          price != null && prevClose ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : null;
        const high = m.regularMarketDayHigh != null ? Number(m.regularMarketDayHigh.toFixed(2)) : price;
        const low = m.regularMarketDayLow != null ? Number(m.regularMarketDayLow.toFixed(2)) : price;
        const openPrice = m.regularMarketOpen != null ? Number(m.regularMarketOpen.toFixed(2)) : prevClose;

        const volNum = m.regularMarketVolume;
        const volumeStr =
          sym === '^NSEI' && (!volNum || volNum === 0)
            ? 'Index'
            : volNum > 1e9
              ? `${(volNum / 1e9).toFixed(1)}B`
              : volNum > 1e6
                ? `${(volNum / 1e6).toFixed(1)}M`
                : volNum > 1e3
                  ? `${(volNum / 1e3).toFixed(1)}K`
                  : volNum != null
                    ? String(volNum)
                    : 'N/A';

        return {
          symbol: sym,
          name: meta.name || m.shortName || sym,
          price,
          change,
          changePercent,
          volume: volumeStr,
          high,
          low,
          marketCap: sym === '^NSEI' ? 'Index' : 'N/A',
          peRatio: null,
          openPrice,
          currency: meta.currency || (sym === '^NSEI' ? 'PTS' : isNse ? 'INR' : 'USD'),
          exchange: meta.exchange || (isNse ? 'NSE' : 'NASDAQ'),
          lastObservedDate,
          isLive: price !== null,
          fetchedAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn(`[YahooService] Failed to fetch live summary for ${sym}: ${err.message}`);
  }

  return {
    symbol: sym,
    name: meta.name || sym,
    price: null,
    change: null,
    changePercent: null,
    volume: 'N/A',
    high: null,
    low: null,
    marketCap: 'N/A',
    peRatio: null,
    openPrice: null,
    currency: meta.currency || (sym === '^NSEI' ? 'PTS' : isNse ? 'INR' : 'USD'),
    exchange: meta.exchange || (isNse ? 'NSE' : 'NASDAQ'),
    lastObservedDate: null,
    isLive: false,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetches historical OHLCV candles using adjusted OHLC scaling (auto_adjust convention)
 * and calculates SMA 20 & SMA 50 overlays. Returns [] on network failure.
 */
export async function getStockHistory(symbol, timeframe = '3M') {
  const sym = symbol.toUpperCase().trim();
  const tf = (timeframe || '3M').toUpperCase();
  const { range, interval } = TIMEFRAME_TO_RANGE_MAP[tf] || TIMEFRAME_TO_RANGE_MAP['3M'];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, { headers: YF_HEADERS });

    if (res.ok) {
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const timestamps = result?.timestamp;
      const quote = result?.indicators?.quote?.[0];
      const adjCloseArr = result?.indicators?.adjclose?.[0]?.adjclose;

      if (timestamps && timestamps.length > 0 && quote) {
        const records = [];
        const closes = [];

        for (let i = 0; i < timestamps.length; i++) {
          const rawC = quote.close?.[i];
          if (rawC === null || rawC === undefined) continue;

          const adjC = adjCloseArr?.[i];
          const adjRatio = adjC != null && rawC !== 0 ? adjC / rawC : 1.0;

          const closeVal = Number((rawC * adjRatio).toFixed(2));
          const openRaw = quote.open?.[i] ?? rawC;
          const highRaw = quote.high?.[i] ?? rawC;
          const lowRaw = quote.low?.[i] ?? rawC;
          const volRaw = quote.volume?.[i] ?? 0;

          closes.push(closeVal);

          const slice20 = closes.slice(-Math.min(20, closes.length));
          const sma20 = Number((slice20.reduce((a, b) => a + b, 0) / slice20.length).toFixed(2));

          const slice50 = closes.slice(-Math.min(50, closes.length));
          const sma50 = Number((slice50.reduce((a, b) => a + b, 0) / slice50.length).toFixed(2));

          const dateStr = new Date(timestamps[i] * 1000).toISOString().split('T')[0];

          records.push({
            date: dateStr,
            open: Number((openRaw * adjRatio).toFixed(2)),
            high: Number((highRaw * adjRatio).toFixed(2)),
            low: Number((lowRaw * adjRatio).toFixed(2)),
            close: closeVal,
            volume: Number(volRaw || 0),
            sma20,
            sma50,
          });
        }

        return records;
      }
    }
  } catch (err) {
    console.warn(`[YahooService] Failed to fetch live history for ${sym}: ${err.message}`);
  }

  return [];
}

/**
 * Returns real-time global market indices from Yahoo Finance.
 */
export async function getMarketOverview() {
  const indexTickers = [
    { ticker: '^NSEI', name: 'NIFTY 50' },
    { ticker: '^BSESN', name: 'SENSEX' },
    { ticker: '^IXIC', name: 'NASDAQ' },
    { ticker: '^DJI', name: 'DOW JONES' },
    { ticker: '^GSPC', name: 'S&P 500' },
    { ticker: 'GC=F', name: 'GOLD' },
    { ticker: 'USDINR=X', name: 'USD/INR' },
  ];

  try {
    const results = await Promise.all(
      indexTickers.map(async ({ ticker, name }) => {
        try {
          const res = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`,
            { headers: YF_HEADERS }
          );
          if (res.ok) {
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (meta && meta.regularMarketPrice != null) {
              const price = meta.regularMarketPrice;
              const prev = meta.chartPreviousClose || price;
              const change = price - prev;
              const changePct = prev ? ((price - prev) / prev) * 100 : 0;
              const isPositive = change >= 0;
              return {
                name,
                value: price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                change: `${isPositive ? '+' : ''}${change.toFixed(2)}`,
                changePercent: `${isPositive ? '+' : ''}${changePct.toFixed(2)}%`,
                isPositive,
              };
            }
          }
        } catch (e) {
          // ignore individual ticker timeout
        }
        return null;
      })
    );

    return results.filter(Boolean);
  } catch (err) {
    console.warn(`[YahooService] getMarketOverview error: ${err.message}`);
    return [];
  }
}
