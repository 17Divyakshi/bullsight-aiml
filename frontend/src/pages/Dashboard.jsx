import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { MarketTicker } from '../components/MarketTicker';
import { StockChart } from '../components/StockChart';
import { PredictionCard } from '../components/PredictionCard';
import { IndicatorCard } from '../components/IndicatorCard';
import { TechnicalIndicatorExplorer } from '../components/TechnicalIndicatorExplorer';
import { StockComparisonPanel } from '../components/StockComparisonPanel';
import { NewsCard } from '../components/NewsCard';
import { UnavailableState } from '../components/UnavailableState';
import { Footer } from '../components/Footer';
import { stockAPI } from '../services/api';
import { formatAssetPrice, formatSignedPercent, formatTimestamp } from '../utils/formatters';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Bookmark,
  Check,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Clock,
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { POPULAR_CHIPS, SUPPORTED_FIVE_STOCKS } from '../data/stocks';

export const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramSymbol = searchParams.get('symbol') || '^NSEI';
  const [symbol, setSymbol] = useState(paramSymbol);

  useEffect(() => {
    const sym = searchParams.get('symbol');
    if (sym && sym !== symbol) {
      setSymbol(sym);
    }
  }, [searchParams, symbol]);

  const handleSelectSymbol = newSym => {
    setSymbol(newSym);
    setSearchParams({ symbol: newSym });
  };

  const [timeframe, setTimeframe] = useState('3M');
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [indicators, setIndicators] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [news, setNews] = useState(null);
  const [featuredCards, setFeaturedCards] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bullsight_watchlist') || '[]');
      setIsWatchlisted(Array.isArray(saved) && saved.includes(symbol));
    } catch {
      setIsWatchlisted(false);
    }
  }, [symbol]);

  const toggleWatchlist = async () => {
    try {
      const saved = JSON.parse(localStorage.getItem('bullsight_watchlist') || '[]');
      const list = Array.isArray(saved) ? saved : [];
      let updated;
      if (list.includes(symbol)) {
        updated = list.filter(s => s !== symbol);
        setIsWatchlisted(false);
        await stockAPI.deleteFromWatchlist(symbol);
      } else {
        updated = [...list, symbol];
        setIsWatchlisted(true);
        await stockAPI.addToWatchlist(symbol);
      }
      localStorage.setItem('bullsight_watchlist', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const loadFeaturedFive = useCallback(async () => {
    setLoadingFeatured(true);
    try {
      const results = await Promise.all(
        SUPPORTED_FIVE_STOCKS.map(async item => {
          const [sum, pred] = await Promise.all([
            stockAPI.getSummary(item.symbol),
            stockAPI.getPrediction(item.symbol, { buyThreshold: 1.0, sellThreshold: -1.0 }),
          ]);
          const latestClose = sum?.isLive
            ? sum.price
            : pred?.last_observed_close != null
              ? pred.last_observed_close
              : null;
          const mlVerified = Boolean(pred?.ml_verified && pred?.predicted_next_close != null);
          return {
            ...item,
            latestClose,
            isLive: Boolean(sum?.isLive),
            changePercent: sum?.changePercent,
            mlVerified,
            predictedNext: mlVerified ? pred.predicted_next_close : null,
            predictedPct: mlVerified ? pred.predicted_change_percent : null,
            model: pred?.selected_model || null,
            signal: mlVerified ? pred.signal : null,
          };
        })
      );
      setFeaturedCards(results);
    } catch (e) {
      console.error('Error loading supported assets:', e);
    } finally {
      setLoadingFeatured(false);
    }
  }, []);

  const loadDashboardData = useCallback(async (sym = symbol, tf = timeframe) => {
    setLoading(true);
    try {
      const [sumRes, histRes, indRes, predRes, newsRes] = await Promise.all([
        stockAPI.getSummary(sym),
        stockAPI.getHistory(sym, tf),
        stockAPI.getIndicators(sym),
        stockAPI.getPrediction(sym, { buyThreshold: 1.0, sellThreshold: -1.0 }),
        stockAPI.getNews(sym),
      ]);

      setSummary(sumRes);
      setHistory(Array.isArray(histRes?.history) ? histRes.history : []);
      setIndicators(indRes);
      setPrediction(predRes);
      setNews(newsRes);
      setLastUpdated(sumRes?.fetchedAt || new Date().toISOString());
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    loadFeaturedFive();
  }, [loadFeaturedFive]);

  useEffect(() => {
    loadDashboardData(symbol, timeframe);
  }, [symbol, timeframe, loadDashboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeaturedFive();
    loadDashboardData(symbol, timeframe);
  };

  const isSummaryLive = Boolean(summary?.isLive && summary?.price != null);
  const isPos = (summary?.change || 0) >= 0;
  const rsiRaw = indicators?.rsi?.value;
  const rsiValue = rsiRaw != null ? Number(rsiRaw) : null;
  const trendNote =
    rsiValue === null
      ? 'Indicator summary will display once observed historical session data is available.'
      : rsiValue > 65
        ? `RSI (${rsiValue.toFixed(1)}) sits in elevated momentum territory — watch for short-term consolidation.`
        : rsiValue < 35
          ? `RSI (${rsiValue.toFixed(1)}) reflects oversold conditions — monitor moving averages for stabilization.`
          : `RSI (${rsiValue.toFixed(1)}) holds inside a balanced range relative to 20-day and 50-day trend structure.`;

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <MarketTicker />

        <TopBar
          title="Market Dashboard"
          onSelectSymbol={handleSelectSymbol}
          currentSymbol={symbol}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Page Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Market Intelligence Terminal
                </h2>
                {lastUpdated && (
                  <span className="text-[11px] font-mono text-[#7B8AA8] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#38D9F5]" />
                    <span>Observed Session Sync · {formatTimestamp(lastUpdated)}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#AAB7D0]">
                Core NSE benchmark coverage, 2D &amp; 3D candlestick visualization, technical indicators, and next-session AI forecasts.
              </p>
            </div>

            <div className="flex items-center space-x-2.5 shrink-0">
              <button
                type="button"
                onClick={toggleWatchlist}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all whitespace-nowrap ${
                  isWatchlisted
                    ? 'bg-[#31E981]/15 text-[#31E981] border-[#31E981]/35'
                    : 'bg-[#10182B] text-[#AAB7D0] border-[rgba(125,160,255,0.22)] hover:border-[#38D9F5]/45 hover:text-[#F8FAFF]'
                }`}
              >
                {isWatchlisted ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isWatchlisted ? 'Watchlisted' : 'Add Watchlist'}</span>
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="px-3.5 py-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] text-[#F8FAFF] hover:text-[#31E981] hover:border-[#31E981]/45 transition-all disabled:opacity-50 flex items-center space-x-1.5 text-xs font-semibold whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#31E981]' : 'text-[#38D9F5]'}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Core 5 Supported Assets Snapshot Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#31E981]" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-[#AAB7D0]">
                  Supported Core Assets · Next-Session Forecast Snapshot
                </h3>
              </div>
              <Link to={`/predictions?symbol=${encodeURIComponent(symbol)}`} className="text-xs font-semibold text-[#38D9F5] hover:text-[#31E981] transition-colors whitespace-nowrap">
                Full Forecast Workspace →
              </Link>
            </div>

            {loadingFeatured ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="bull-card p-4 h-36 animate-pulse bg-[#10182B]/70" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {featuredCards.map(item => {
                  const selected = symbol === item.symbol;
                  const pct = item.mlVerified && item.predictedPct != null ? Number(item.predictedPct) : null;
                  const up = pct != null ? pct >= 0 : true;
                  return (
                    <button
                      type="button"
                      key={item.symbol}
                      onClick={() => handleSelectSymbol(item.symbol)}
                      className={`bull-card bull-card-interactive p-4 text-left space-y-2.5 transition-all ${
                        selected
                          ? 'ring-2 ring-[#31E981] border-[#31E981]/50 bg-[#151F36]'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold font-display text-[#F8FAFF] truncate">
                          {item.shortLabel}
                        </span>
                        {item.mlVerified && pct != null ? (
                          <span
                            className={`text-[10px] font-mono font-bold inline-flex items-center tabular-nums ${
                              up ? 'text-[#31E981]' : 'text-[#FF586A]'
                            }`}
                          >
                            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {formatSignedPercent(pct)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-[#7B8AA8]">
                            {item.symbol}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between items-baseline gap-1">
                          <span className="text-[10px] text-[#7B8AA8]">Close:</span>
                          <span className="font-bold text-[#F8FAFF] tabular-nums">
                            {item.latestClose != null
                              ? formatAssetPrice(item.latestClose, item.symbol)
                              : 'Unavailable'}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline gap-1">
                          <span className="text-[10px] text-[#7B8AA8]">Next Close:</span>
                          <span className={`font-extrabold tabular-nums ${item.mlVerified ? 'text-[#31E981]' : 'text-[#7B8AA8]'}`}>
                            {item.mlVerified
                              ? formatAssetPrice(item.predictedNext, item.symbol)
                              : 'Unavailable'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[rgba(125,160,255,0.14)] flex items-center justify-between text-[10px] font-mono text-[#7B8AA8]">
                        <span className="truncate max-w-[115px]" title={item.model || 'Pending model verification'}>
                          {item.model || 'Inference offline'}
                        </span>
                        <span
                          className={`font-bold ${
                            !item.mlVerified
                              ? 'text-[#7B8AA8]'
                              : item.signal === 'BUY'
                                ? 'text-[#31E981]'
                                : item.signal === 'SELL'
                                  ? 'text-[#FF586A]'
                                  : 'text-[#4D8DFF]'
                          }`}
                        >
                          {item.mlVerified ? item.signal : 'N/A'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick-Switch Catalog Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-mono font-semibold text-[#7B8AA8] shrink-0 mr-1">
              Quick Switch:
            </span>
            {POPULAR_CHIPS.map(chip => {
              const active = symbol === chip;
              const isNSE = chip.endsWith('.NS');
              return (
                <button
                  type="button"
                  key={chip}
                  onClick={() => handleSelectSymbol(chip)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all shrink-0 flex items-center space-x-1 border whitespace-nowrap ${
                    active
                      ? 'bg-[#31E981]/15 text-[#31E981] border-[#31E981]/45 font-bold'
                      : 'bg-[#10182B] text-[#AAB7D0] border-[rgba(125,160,255,0.18)] hover:border-[#38D9F5]/45 hover:text-[#F8FAFF]'
                  }`}
                >
                  <span>{chip === '^NSEI' ? 'NIFTY 50' : chip.replace('.NS', '')}</span>
                  {isNSE && <span className="text-[10px] text-[#7B8AA8] font-normal">.NSE</span>}
                </button>
              );
            })}
          </div>

          {/* Primary Equity Summary Banner */}
          {loading && !summary ? (
            <div className="bull-card p-6 animate-pulse space-y-4">
              <div className="h-6 w-48 bg-[#151F36] rounded" />
              <div className="h-10 w-64 bg-[#151F36] rounded" />
            </div>
          ) : !isSummaryLive ? (
            <UnavailableState
              compact
              title="Live market data or AI prediction is currently unavailable."
              description={`Observed quote data for ${symbol} could not be loaded from Yahoo Finance right now.`}
              onRetry={() => loadDashboardData(symbol, timeframe)}
              retrying={refreshing}
            />
          ) : (
            <div className="bull-card p-5 sm:p-6 animate-fade-in">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#7B8AA8]">
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-[#F8FAFF] tracking-tight">
                      {summary.symbol}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#AAB7D0] font-medium">{summary.name}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[#38D9F5]">
                      {summary.exchange || (symbol === '^NSEI' || symbol.endsWith('.NS') ? 'NSE' : 'Global')}
                    </span>
                    {summary.lastObservedDate && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">Last Session: {summary.lastObservedDate}</span>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-baseline gap-3 pt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-[#F8FAFF] tabular-nums tracking-tight">
                      {formatAssetPrice(summary.price, symbol)}
                    </span>
                    {summary.change != null && (
                      <span
                        className={`text-sm sm:text-base font-bold font-mono tabular-nums flex items-center ${
                          isPos ? 'text-[#31E981]' : 'text-[#FF586A]'
                        }`}
                      >
                        {isPos ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                        {isPos ? '+' : ''}{Number(summary.change).toFixed(2)} ({formatSignedPercent(summary.changePercent)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#070B1A]/75 p-3.5 rounded-xl border border-[rgba(125,160,255,0.16)]">
                    <span className="text-[10px] text-[#7B8AA8] block uppercase">Session Range</span>
                    <span className="font-bold text-[#F8FAFF] tabular-nums mt-1 block">
                      {summary.low != null && summary.high != null
                        ? `${formatAssetPrice(summary.low, symbol, { includeUnit: false })} – ${formatAssetPrice(summary.high, symbol, { includeUnit: false })}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-[#070B1A]/75 p-3.5 rounded-xl border border-[rgba(125,160,255,0.16)]">
                    <span className="text-[10px] text-[#7B8AA8] block uppercase">Volume</span>
                    <span className="font-bold text-[#F8FAFF] tabular-nums mt-1 block">
                      {summary.volume || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-[#070B1A]/75 p-3.5 rounded-xl border border-[rgba(125,160,255,0.16)]">
                    <span className="text-[10px] text-[#7B8AA8] block uppercase">Market Cap</span>
                    <span className="font-bold text-[#F8FAFF] tabular-nums mt-1 block">
                      {summary.marketCap || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-[#070B1A]/75 p-3.5 rounded-xl border border-[rgba(125,160,255,0.16)]">
                    <span className="text-[10px] text-[#7B8AA8] block uppercase">P/E Ratio</span>
                    <span className="font-bold text-[#38D9F5] tabular-nums mt-1 block">
                      {summary.peRatio || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Market Trend Summary */}
          <div className="bull-card px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-[#38D9F5]/12 border border-[#38D9F5]/25 text-[#38D9F5] shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold font-display text-[#F8FAFF] block">
                  Technical Trend Summary · {symbol}
                </span>
                <p className="text-xs text-[#AAB7D0] leading-relaxed">
                  {trendNote}
                </p>
              </div>
            </div>
            <Link
              to={`/predictions?symbol=${encodeURIComponent(symbol)}`}
              className="text-xs font-bold text-[#31E981] hover:text-[#38D9F5] transition-colors shrink-0 whitespace-nowrap"
            >
              Configure Signal Thresholds →
            </Link>
          </div>

          {/* Technical Indicator Summary Cards */}
          <IndicatorCard
            indicators={indicators}
            symbol={symbol}
            loading={loading}
            onRetry={() => loadDashboardData(symbol, timeframe)}
          />

          {/* Main Workspace: Historical Chart (with 3D Candles toggle) + Next-Session Forecast Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <StockChart
                history={history}
                symbol={symbol}
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
                loading={loading}
                onRetry={() => loadDashboardData(symbol, timeframe)}
              />
            </div>

            <div className="lg:col-span-1">
              <PredictionCard
                prediction={prediction}
                symbol={symbol}
                loading={loading}
                onRetry={() => loadDashboardData(symbol, timeframe)}
              />
            </div>
          </div>

          {/* Interactive Technical Indicator Explorer */}
          <TechnicalIndicatorExplorer
            history={history}
            indicators={indicators}
            symbol={symbol}
            loading={loading}
            onRetry={() => loadDashboardData(symbol, timeframe)}
          />

          {/* Interactive Multi-Stock Comparison */}
          <StockComparisonPanel />

          {/* Market News & Sentiment Feed */}
          <NewsCard
            newsData={news}
            loading={loading}
            onRetry={() => loadDashboardData(symbol, timeframe)}
          />

          <Footer />
        </main>
      </div>
    </div>
  );
};
