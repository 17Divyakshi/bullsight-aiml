import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { UnavailableState } from '../components/UnavailableState';
import { stockAPI } from '../services/api';
import { SUPPORTED_FIVE_STOCKS } from '../data/stocks';
import { formatAssetPrice, formatShortTick, formatSignedPercent } from '../utils/formatters';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { LiveMarketHeatmap } from '../components/LiveMarketHeatmap';
import { StockComparisonPanel } from '../components/StockComparisonPanel';
import { BackendStatusPanel } from '../components/BackendStatusPanel';
import {
  ArrowRight,
  Cpu,
  BarChart2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Database,
  Layers,
  Activity,
  Gauge,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

const HeroScene3D = lazy(() => import('../components/three/HeroScene3D'));
const NeuralNetwork3D = lazy(() => import('../components/three/NeuralNetwork3D'));
const MarketExplorer3D = lazy(() => import('../components/three/MarketExplorer3D'));

const PIPELINE_STEPS = [
  {
    step: '01',
    title: 'Market Data',
    detail: 'Adjusted daily OHLCV market feeds from Yahoo Finance across NIFTY 50 & NSE leaders.',
    color: 'text-[#38D9F5] border-[#38D9F5]/30',
  },
  {
    step: '02',
    title: 'Feature Engineering',
    detail: '14 technical signals: SMA, EMA, RSI (14), MACD, Signal Line, and Bollinger Bands.',
    color: 'text-[#4D8DFF] border-[#4D8DFF]/30',
  },
  {
    step: '03',
    title: 'ML Models',
    detail: 'Linear Regression, Random Forest, and LSTM benchmarked against Previous Close Baseline.',
    color: 'text-[#9065FF] border-[#9065FF]/30',
  },
  {
    step: '04',
    title: 'Prediction',
    detail: 'Next-session closing price projection selected strictly by lowest validation MAE.',
    color: 'text-[#31E981] border-[#31E981]/30',
  },
  {
    step: '05',
    title: 'Visualization',
    detail: 'Interactive 2D & 3D WebGL candlestick charts, backtesting curves, and transparent metrics.',
    color: 'text-[#38D9F5] border-[#38D9F5]/30',
  },
];

const FEATURE_CARDS = [
  {
    title: 'AI Stock Predictions',
    description:
      'Next observed trading-session closing price estimates with configurable BUY/SELL/HOLD percentage thresholds and provenance metadata.',
    icon: Cpu,
    to: '/predictions',
    cta: 'Open AI Predictions',
    accent: 'text-[#31E981] bg-[#31E981]/12 border-[#31E981]/30',
  },
  {
    title: 'Market Intelligence',
    description:
      'Live observed equities dashboard, multi-market screener, portfolio valuation tracking, and financial news sentiment feeds.',
    icon: Activity,
    to: '/dashboard',
    cta: 'Explore Dashboard',
    accent: 'text-[#38D9F5] bg-[#38D9F5]/12 border-[#38D9F5]/30',
  },
  {
    title: 'Model Performance',
    description:
      'Transparent historical evaluation comparing Linear Regression, Random Forest, LSTM, and baseline persistence across MAE, RMSE, R², and MAPE.',
    icon: Gauge,
    to: '/model-performance',
    cta: 'Inspect Benchmarks',
    accent: 'text-[#9065FF] bg-[#9065FF]/12 border-[#9065FF]/30',
  },
  {
    title: 'Technical Analysis',
    description:
      'Interactive 2D and real 3D WebGL candlestick geometry with SMA 20/50, EMA 20, RSI (14), MACD crossovers, and Bollinger positioning.',
    icon: BarChart2,
    to: '/dashboard',
    cta: 'Launch 3D Charts',
    accent: 'text-[#4D8DFF] bg-[#4D8DFF]/12 border-[#4D8DFF]/30',
  },
];

export const Home = () => {
  const [activeSymbol, setActiveSymbol] = useState(SUPPORTED_FIVE_STOCKS[0].symbol);
  const [previewSummary, setPreviewSummary] = useState(null);
  const [previewHistory, setPreviewHistory] = useState([]);
  const [previewPrediction, setPreviewPrediction] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [coreNodes, setCoreNodes] = useState([]);
  const [loadingCoreNodes, setLoadingCoreNodes] = useState(true);
  const [labTab, setLabTab] = useState('heatmap');
  const [labBuyThr, setLabBuyThr] = useState(1.0);
  const [labSellThr, setLabSellThr] = useState(-1.0);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  const loadCoreNodes = async () => {
    setLoadingCoreNodes(true);
    try {
      const results = await Promise.all(
        SUPPORTED_FIVE_STOCKS.map(async item => {
          const [sum, pred] = await Promise.all([
            stockAPI.getSummary(item.symbol),
            stockAPI.getPrediction(item.symbol),
          ]);
          const mlVerified = Boolean(pred?.ml_verified && pred?.predicted_next_close != null);
          return {
            ...item,
            price: sum?.isLive ? sum.price : pred?.last_observed_close ?? null,
            changePercent: sum?.isLive ? sum.changePercent : null,
            volume: sum?.volume ?? null,
            mlVerified,
            predictedNext: mlVerified ? pred.predicted_next_close : null,
            signal: mlVerified ? pred.signal : null,
          };
        })
      );
      setCoreNodes(results);
    } finally {
      setLoadingCoreNodes(false);
    }
  };

  const loadPreview = async (sym = activeSymbol, buyThr = labBuyThr, sellThr = labSellThr) => {
    setLoadingPreview(true);
    setLoadingMetrics(true);
    try {
      const [sum, histRes, pred, metRes] = await Promise.all([
        stockAPI.getSummary(sym),
        stockAPI.getHistory(sym, '1M'),
        stockAPI.getPrediction(sym, { buyThreshold: buyThr, sellThreshold: sellThr }),
        stockAPI.getModelMetrics(sym),
      ]);
      setPreviewSummary(sum);
      setPreviewHistory(Array.isArray(histRes?.history) ? histRes.history.slice(-24) : []);
      setPreviewPrediction(pred);
      setModelMetrics(metRes);
    } catch {
      setPreviewSummary({ available: false, isLive: false });
      setPreviewHistory([]);
      setPreviewPrediction(null);
      setModelMetrics(null);
    } finally {
      setLoadingPreview(false);
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadCoreNodes();
  }, []);

  useEffect(() => {
    loadPreview(activeSymbol, labBuyThr, labSellThr);
  }, [activeSymbol]);

  const summaryLive = Boolean(previewSummary?.available && previewSummary?.price != null);
  const dayPos = Number(previewSummary?.change ?? 0) >= 0;
  const predVerified = Boolean(
    previewPrediction?.ml_verified && previewPrediction?.predicted_next_close != null
  );
  const predDelta = Number(previewPrediction?.predicted_change_percent ?? 0);
  const predPos = predDelta >= 0;
  const signal = String(previewPrediction?.signal || 'HOLD').toUpperCase();

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex flex-col font-sans selection:bg-[#31E981]/25 selection:text-[#31E981]">
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] origin-left bg-gradient-to-r from-[#31E981] via-[#38D9F5] to-[#9065FF] z-[60]"
      />

      <Navbar />

      {/* Cinematic 3D Hero Section: Left Copy + Right Interactive WebGL Canvas (Existing 3D Bull Preserved) */}
      <section className="relative pt-10 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-grid-pattern">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -left-24 w-[420px] h-[420px] rounded-full bg-[#31E981]/10 blur-[110px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-10 right-0 w-[480px] h-[480px] rounded-full bg-[#38D9F5]/10 blur-[120px]"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Headline, Subtitle, CTAs, Supported 5 Assets */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-6 space-y-6"
            >
              <div className="text-xs font-mono font-semibold uppercase tracking-[0.18em] text-[#38D9F5]">
                See the Trend · Predict the Move
              </div>

              <h1
                className="text-4xl sm:text-5xl xl:text-[56px] font-extrabold tracking-tight font-display text-[#F8FAFF] leading-[1.06]"
                style={{ textWrap: 'balance' }}
              >
                Predict the Market.{' '}
                <span className="bg-gradient-to-r from-[#31E981] via-[#38D9F5] to-[#4D8DFF] bg-clip-text text-transparent">
                  See Beyond
                </span>{' '}
                the Numbers.
              </h1>

              <p className="text-base sm:text-lg text-[#AAB7D0] max-w-xl leading-relaxed">
                Explore intelligent stock predictions, real market insights, and advanced AI analytics through an immersive financial experience.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link
                  to="/dashboard"
                  className="px-7 py-3.5 rounded-xl text-sm font-extrabold font-display text-[#070B1A] bg-gradient-to-r from-[#31E981] via-[#38D9F5] to-[#4D8DFF] hover:shadow-bullGlow transition-all flex items-center justify-center space-x-2 group whitespace-nowrap"
                >
                  <span>Explore Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <Link
                  to="/predictions"
                  className="px-7 py-3.5 rounded-xl text-sm font-bold font-display text-[#F8FAFF] bg-[#10182B] border border-[rgba(125,160,255,0.28)] hover:border-[#38D9F5]/60 hover:bg-[#151F36] transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
                >
                  <Cpu className="w-4 h-4 text-[#31E981]" />
                  <span>Try AI Prediction</span>
                </Link>
              </div>

              {/* 5 Supported Benchmark & Equity Quick Selector */}
              <div className="pt-3 border-t border-[rgba(125,160,255,0.14)] space-y-2.5">
                <div className="text-[11px] font-mono text-[#7B8AA8] uppercase tracking-wider">
                  Core ML-Supported Assets
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_FIVE_STOCKS.map(stock => {
                    const active = activeSymbol === stock.symbol;
                    return (
                      <button
                        key={stock.symbol}
                        type="button"
                        onClick={() => setActiveSymbol(stock.symbol)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border whitespace-nowrap ${
                          active
                            ? 'bg-[#31E981]/15 text-[#31E981] border-[#31E981]/45 font-bold'
                            : 'bg-[#10182B] text-[#AAB7D0] border-[rgba(125,160,255,0.18)] hover:border-[#38D9F5]/45 hover:text-[#F8FAFF]'
                        }`}
                      >
                        {stock.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Right Column: Interactive 3D WebGL Bull vs Bear Holographic Terminal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="lg:col-span-6"
            >
              <Suspense
                fallback={
                  <div className="w-full h-[430px] sm:h-[500px] lg:h-[540px] rounded-3xl bg-[#10182B] border border-[rgba(125,160,255,0.2)] flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
                    Loading 3D BULLSIGHT Terminal...
                  </div>
                }
              >
                <HeroScene3D
                  heroPreview={{
                    symbol: activeSymbol,
                    price: previewSummary?.price,
                    changePercent: previewSummary?.changePercent,
                    prediction: previewPrediction,
                  }}
                />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 2: 4 Core Feature Glass Cards */}
      <section className="py-16 border-t border-[rgba(125,160,255,0.14)] bg-[#0A1024]/55">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-mono font-bold text-[#31E981] uppercase tracking-wider">
                Platform Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                Institutional-Grade Depth, Transparent AI Execution.
              </h2>
            </div>
            <Link
              to="/model-performance"
              className="text-xs font-mono font-bold text-[#38D9F5] hover:underline whitespace-nowrap"
            >
              Inspect Model Benchmarks →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            {FEATURE_CARDS.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: idx * 0.06 }}
                  className="bull-card bull-card-interactive p-6 flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3.5">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${card.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold font-display text-[#F8FAFF]">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#AAB7D0] leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <Link
                    to={card.to}
                    className="inline-flex items-center space-x-1.5 text-xs font-mono font-bold text-[#38D9F5] hover:text-[#31E981] transition-colors"
                  >
                    <span>{card.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Interactive Live Observed Market Preview */}
      <section className="py-16 border-t border-[rgba(125,160,255,0.14)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="bull-card p-5 sm:p-7 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[rgba(125,160,255,0.16)]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#38D9F5]">
                  Live Market &amp; Inference Preview
                </span>
                <h2 className="text-base sm:text-lg font-extrabold font-display text-[#F8FAFF]">
                  {activeSymbol} · Observed Price History &amp; Next-Session Status
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {SUPPORTED_FIVE_STOCKS.map(stock => {
                  const active = activeSymbol === stock.symbol;
                  return (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => setActiveSymbol(stock.symbol)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border whitespace-nowrap ${
                        active
                          ? 'bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A] border-transparent font-bold'
                          : 'bg-[#10182B] text-[#AAB7D0] border-[rgba(125,160,255,0.18)] hover:border-[#38D9F5]/45 hover:text-[#F8FAFF]'
                      }`}
                    >
                      {stock.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left 2 Columns: Observed Chart */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-[#070B1A]/75 border border-[rgba(125,160,255,0.16)] space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div>
                    <span className="text-[11px] text-[#7B8AA8] font-mono block">
                      {previewSummary?.name || activeSymbol} · {previewSummary?.exchange || 'NSE'}
                    </span>
                    <div className="flex items-baseline space-x-3 mt-0.5">
                      <h3 className="text-xl font-extrabold font-display text-[#F8FAFF]">
                        {activeSymbol}
                      </h3>
                      {summaryLive && (
                        <span className="text-xl font-extrabold font-mono text-[#F8FAFF] tabular-nums">
                          {formatAssetPrice(previewSummary.price, activeSymbol)}
                        </span>
                      )}
                    </div>
                  </div>

                  {summaryLive && previewSummary.changePercent != null && (
                    <div
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-mono font-bold tabular-nums ${
                        dayPos
                          ? 'bg-[#31E981]/12 text-[#31E981] border-[#31E981]/30'
                          : 'bg-[#FF586A]/12 text-[#FF586A] border-[#FF586A]/30'
                      }`}
                    >
                      {dayPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{formatSignedPercent(previewSummary.changePercent)}</span>
                    </div>
                  )}
                </div>

                <div className="h-56 w-full">
                  {loadingPreview ? (
                    <div className="h-full w-full rounded-xl bg-[#10182B] animate-pulse flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
                      Loading {activeSymbol} observed history...
                    </div>
                  ) : previewHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <UnavailableState
                        compact
                        title="Live market data or AI prediction is currently unavailable."
                        description={`Unable to load recent sessions for ${activeSymbol}.`}
                        onRetry={() => loadPreview(activeSymbol)}
                      />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={previewHistory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="homeCyberArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#31E981" stopOpacity={0.32} />
                            <stop offset="95%" stopColor="#4D8DFF" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          tickLine={false}
                          axisLine={false}
                          minTickGap={24}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={val => formatShortTick(val, activeSymbol)}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#10182B',
                            borderColor: 'rgba(125,160,255,0.28)',
                            borderRadius: 12,
                            fontSize: 11,
                            fontFamily: 'JetBrains Mono',
                            color: '#F8FAFF',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="close"
                          stroke="#31E981"
                          strokeWidth={2.3}
                          fillOpacity={1}
                          fill="url(#homeCyberArea)"
                          name="Observed Close"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Right Column: Honest Next-Session Inference Preview */}
              <div className="p-5 rounded-2xl bg-[#10182B] border border-[rgba(125,160,255,0.18)] flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,255,0.16)]">
                    <span className="text-xs font-bold text-[#F8FAFF] font-display">
                      Next-Session AI Forecast
                    </span>
                    <span className="text-[10px] font-mono text-[#38D9F5]">
                      {predVerified ? 'Verified' : 'Status'}
                    </span>
                  </div>

                  {loadingPreview ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-8 w-36 bg-[#151F36] rounded" />
                      <div className="h-14 w-full bg-[#151F36] rounded-xl" />
                    </div>
                  ) : predVerified ? (
                    <>
                      <div>
                        <span className="text-[11px] font-mono text-[#7B8AA8] block">
                          Predicted Next-Session Close
                        </span>
                        <div className="text-3xl font-extrabold font-mono text-[#31E981] tabular-nums tracking-tight mt-1">
                          {formatAssetPrice(previewPrediction.predicted_next_close, activeSymbol)}
                        </div>
                        <span
                          className={`inline-flex items-center text-xs font-mono font-bold mt-1 tabular-nums ${
                            predPos ? 'text-[#31E981]' : 'text-[#FF586A]'
                          }`}
                        >
                          {formatSignedPercent(predDelta)} vs last observed close
                        </span>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-[rgba(125,160,255,0.14)] text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-[#7B8AA8]">Model:</span>
                          <span className="text-[#F8FAFF] font-semibold">
                            {previewPrediction.selected_model}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7B8AA8]">Signal:</span>
                          <span
                            className={`font-bold ${
                              signal === 'BUY'
                                ? 'text-[#31E981]'
                                : signal === 'SELL'
                                  ? 'text-[#FF586A]'
                                  : 'text-[#4D8DFF]'
                            }`}
                          >
                            {signal}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#7B8AA8] pt-1">
                          Experimental educational signal only. Not financial advice.
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[#F8FAFF]">
                        Live market data or AI prediction is currently unavailable.
                      </p>
                      <p className="text-[11px] text-[#AAB7D0] leading-relaxed">
                        {previewPrediction?.message ||
                          'Trained model inference for this symbol requires the active ML inference engine.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => loadPreview(activeSymbol)}
                        className="px-3 py-1.5 rounded-lg bg-[#151F36] border border-[rgba(125,160,255,0.22)] text-xs font-mono text-[#38D9F5] inline-flex items-center space-x-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    </div>
                  )}
                </div>

                <Link
                  to={`/predictions?symbol=${encodeURIComponent(activeSymbol)}`}
                  className="w-full py-2.5 rounded-xl bg-[#151F36] border border-[rgba(125,160,255,0.25)] hover:border-[#31E981]/50 text-center text-xs font-bold text-[#31E981] transition-all flex items-center justify-center space-x-1.5"
                >
                  <span>Inspect {activeSymbol} Forecast</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3B: Interactive 3D Market Explorer */}
      <section className="py-14 border-t border-[rgba(125,160,255,0.14)] bg-[#0A1024]/45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="bull-card p-6 h-[400px] flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
                Loading Interactive 3D Market Explorer...
              </div>
            }
          >
            <MarketExplorer3D
              items={coreNodes}
              selectedSymbol={activeSymbol}
              onSelectSymbol={setActiveSymbol}
              onRefresh={loadCoreNodes}
              loading={loadingCoreNodes}
            />
          </Suspense>
        </div>
      </section>

      {/* Section 3C: Interactive Intelligence Suite (Heatmap, Comparison, AI Prediction Lab, Model Intelligence) */}
      <section className="py-16 border-t border-[rgba(125,160,255,0.14)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-[#31E981] uppercase tracking-wider">
                Interactive Market Suite
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                Live Market Heatmap, Multi-Stock Comparison &amp; AI Lab
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-[#10182B] p-1.5 rounded-2xl border border-[rgba(125,160,255,0.2)] text-xs font-mono">
              {[
                { id: 'heatmap', label: 'Live Market Heatmap' },
                { id: 'compare', label: 'Stock Comparison' },
                { id: 'lab', label: 'AI Prediction Lab' },
                { id: 'models', label: 'Model Intelligence' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLabTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap ${
                    labTab === tab.id
                      ? 'bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A]'
                      : 'text-[#AAB7D0] hover:text-[#F8FAFF]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {labTab === 'heatmap' && <LiveMarketHeatmap />}

          {labTab === 'compare' && <StockComparisonPanel />}

          {labTab === 'lab' && (
            <div className="bull-card p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#31E981]" />
                    <h3 className="text-base font-bold font-display text-[#F8FAFF]">
                      AI Prediction Lab · {activeSymbol}
                    </h3>
                  </div>
                  <p className="text-xs text-[#AAB7D0]">
                    Tune BUY/SELL percentage thresholds and inspect real next-session model output without leaving the terminal overview.
                  </p>
                </div>

                <Link
                  to={`/predictions?symbol=${encodeURIComponent(activeSymbol)}`}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A] text-xs font-extrabold inline-flex items-center space-x-1.5 self-start sm:self-auto whitespace-nowrap"
                >
                  <span>Open Full AI Prediction Lab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <div className="lg:col-span-7 space-y-4 text-xs font-mono">
                  <div className="flex flex-wrap gap-2">
                    {SUPPORTED_FIVE_STOCKS.map(s => (
                      <button
                        key={s.symbol}
                        type="button"
                        onClick={() => setActiveSymbol(s.symbol)}
                        className={`px-3 py-1.5 rounded-xl border transition-all ${
                          activeSymbol === s.symbol
                            ? 'bg-[#31E981]/15 border-[#31E981]/45 text-[#31E981] font-bold'
                            : 'bg-[#070B1A] border-[rgba(125,160,255,0.18)] text-[#AAB7D0] hover:text-[#F8FAFF]'
                        }`}
                      >
                        {s.shortLabel}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070B1A]/75 p-4 rounded-xl border border-[rgba(125,160,255,0.16)]">
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#AAB7D0]">BUY Threshold</span>
                        <span className="font-bold text-[#31E981]">+{Number(labBuyThr).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="5"
                        step="0.1"
                        value={labBuyThr}
                        onChange={e => setLabBuyThr(Number(e.target.value))}
                        className="w-full accent-[#31E981] cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#AAB7D0]">SELL Threshold</span>
                        <span className="font-bold text-[#FF586A]">{Number(labSellThr).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="-5"
                        max="-0.2"
                        step="0.1"
                        value={labSellThr}
                        onChange={e => setLabSellThr(Number(e.target.value))}
                        className="w-full accent-[#FF586A] cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadPreview(activeSymbol, labBuyThr, labSellThr)}
                    disabled={loadingPreview}
                    className="px-4 py-2 rounded-xl bg-[#10182B] border border-[#38D9F5]/40 hover:border-[#31E981] text-xs font-mono font-bold text-[#38D9F5] inline-flex items-center space-x-2 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'animate-spin' : ''}`} />
                    <span>Recalculate Next-Session Signal</span>
                  </button>
                </div>

                <div className="lg:col-span-5 p-5 rounded-2xl bg-[#070B1A]/85 border border-[rgba(125,160,255,0.18)] space-y-3">
                  {loadingPreview ? (
                    <div className="h-28 animate-pulse rounded-xl bg-[#10182B]" />
                  ) : predVerified ? (
                    <>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#7B8AA8]">Verified Next Close</span>
                        <span className="text-[#38D9F5]">{previewPrediction.selected_model}</span>
                      </div>
                      <div className="text-3xl font-extrabold font-mono text-[#31E981] tabular-nums">
                        {formatAssetPrice(previewPrediction.predicted_next_close, activeSymbol)}
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[rgba(125,160,255,0.14)]">
                        <span className={predPos ? 'text-[#31E981]' : 'text-[#FF586A]'}>
                          {formatSignedPercent(predDelta)}
                        </span>
                        <span
                          className={`font-bold ${
                            signal === 'BUY'
                              ? 'text-[#31E981]'
                              : signal === 'SELL'
                                ? 'text-[#FF586A]'
                                : 'text-[#4D8DFF]'
                          }`}
                        >
                          Signal: {signal}
                        </span>
                      </div>
                    </>
                  ) : (
                    <UnavailableState
                      compact
                      title="Live market data or AI prediction is currently unavailable."
                      description={
                        previewPrediction?.message ||
                        'Start the FastAPI ML inference service to generate live next-session predictions.'
                      }
                      onRetry={() => loadPreview(activeSymbol, labBuyThr, labSellThr)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {labTab === 'models' && (
            <div className="bull-card p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-[#9065FF]" />
                    <h3 className="text-base font-bold font-display text-[#F8FAFF]">
                      Model Intelligence &amp; Comparison · {activeSymbol}
                    </h3>
                  </div>
                  <p className="text-xs text-[#AAB7D0]">
                    Validation error benchmarks comparing Linear Regression, Random Forest, LSTM, and Previous Close Baseline.
                  </p>
                </div>

                <Link
                  to="/model-performance"
                  className="px-4 py-2 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.24)] hover:border-[#31E981]/50 text-xs font-mono font-bold text-[#38D9F5] inline-flex items-center space-x-1.5 self-start sm:self-auto whitespace-nowrap"
                >
                  <span>Full Benchmark Suite</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loadingMetrics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 rounded-xl bg-[#070B1A] animate-pulse" />
                  ))}
                </div>
              ) : !modelMetrics?.models || modelMetrics.models.length === 0 ? (
                <UnavailableState
                  compact
                  title="Model evaluation metrics are currently unavailable."
                  description={
                    modelMetrics?.message ||
                    'Verified evaluation CSV metrics will render here once the backend ML evaluation artifacts are active.'
                  }
                  onRetry={() => loadPreview(activeSymbol, labBuyThr, labSellThr)}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {modelMetrics.models.slice(0, 4).map(m => {
                    const name = m.name || m.model || m.Model || 'Model';
                    const selected = modelMetrics.selected_model && String(name).toLowerCase() === String(modelMetrics.selected_model).toLowerCase();
                    return (
                      <div
                        key={name}
                        className={`p-4 rounded-xl bg-[#070B1A]/80 border space-y-2.5 text-xs font-mono ${
                          selected ? 'border-[#31E981]/55' : 'border-[rgba(125,160,255,0.16)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#F8FAFF] font-display text-sm">{name}</span>
                          {selected && (
                            <span className="text-[10px] font-bold text-[#31E981] px-2 py-0.5 rounded bg-[#31E981]/12 border border-[#31E981]/30">
                              WINNER
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between">
                            <span className="text-[#7B8AA8]">MAE</span>
                            <span className="text-[#F8FAFF] font-bold tabular-nums">
                              {m.mae != null ? Number(m.mae).toFixed(2) : m.MAE != null ? Number(m.MAE).toFixed(2) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7B8AA8]">RMSE</span>
                            <span className="text-[#F8FAFF] font-bold tabular-nums">
                              {m.rmse != null ? Number(m.rmse).toFixed(2) : m.RMSE != null ? Number(m.RMSE).toFixed(2) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7B8AA8]">R² Score</span>
                            <span className="text-[#38D9F5] font-bold tabular-nums">
                              {m.r2 != null ? Number(m.r2).toFixed(4) : m.R2 != null ? Number(m.R2).toFixed(4) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Animated How BULLSIGHT Works Pipeline + 3D Neural Network Showcase */}
      <section className="py-16 border-t border-[rgba(125,160,255,0.14)] bg-[#0A1024]/55">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-[#38D9F5] uppercase tracking-wider">
              How BULLSIGHT Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#F8FAFF]">
              End-to-End Quantitative Intelligence Pipeline
            </h2>
          </div>

          {/* 5-Stage Animated Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {PIPELINE_STEPS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.06 }}
                className="bull-card p-5 space-y-2.5 relative"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-md border ${item.color}`}>
                    {item.step}
                  </span>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-[#7B8AA8] hidden lg:block" />
                  )}
                </div>
                <h3 className="text-sm font-bold font-display text-[#F8FAFF]">{item.title}</h3>
                <p className="text-xs text-[#AAB7D0] leading-relaxed">{item.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* 3D AI Neural Network Visualization Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#9065FF] font-bold">
                <Layers className="w-4 h-4" />
                <span>Conceptual AI Processing Visualization</span>
              </div>
              <h3 className="text-2xl font-extrabold font-display text-[#F8FAFF] leading-tight">
                Multi-Model Regression &amp; Sequence Intelligence
              </h3>
              <p className="text-xs sm:text-sm text-[#AAB7D0] leading-relaxed">
                BULLSIGHT evaluates <strong className="text-[#F8FAFF]">Linear Regression</strong>,{' '}
                <strong className="text-[#F8FAFF]">Random Forest</strong>,{' '}
                <strong className="text-[#F8FAFF]">LSTM</strong>, and a{' '}
                <strong className="text-[#F8FAFF]">Previous Close Baseline</strong> using standardized 14-feature engineering and selects the stock-specific model by lowest validation MAE.
              </p>
              <p className="text-[11px] text-[#7B8AA8] leading-relaxed">
                The adjacent 3D graph is a conceptual visualization of multi-layer signal propagation and does not depict actual internal weights or layer counts of the regression or LSTM models.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/model-performance"
                  className="px-5 py-2.5 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.25)] hover:border-[#31E981]/50 text-xs font-bold font-mono text-[#31E981] transition-all inline-flex items-center space-x-2"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>View Model Metrics</span>
                </Link>
                <Link
                  to="/backtesting"
                  className="px-5 py-2.5 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.25)] hover:border-[#38D9F5]/50 text-xs font-bold font-mono text-[#38D9F5] transition-all inline-flex items-center space-x-2"
                >
                  <span>Strategy Backtesting</span>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <Suspense
                fallback={
                  <div className="w-full h-[360px] rounded-2xl bg-[#10182B] border border-[rgba(125,160,255,0.2)] flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
                    Loading 3D AI Network Visualization...
                  </div>
                }
              >
                <NeuralNetwork3D />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Live Backend Connection Status */}
      <section className="py-12 border-t border-[rgba(125,160,255,0.14)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackendStatusPanel />
        </div>
      </section>

      <Footer />
    </div>
  );
};
