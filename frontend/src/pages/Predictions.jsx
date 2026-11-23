import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { StockChart } from '../components/StockChart';
import { ChartContainer } from '../components/ChartContainer';
import { UnavailableState } from '../components/UnavailableState';
import { Footer } from '../components/Footer';
import { stockAPI } from '../services/api';
import { formatAssetPrice, formatSignedPercent, formatTimestamp, formatShortTick } from '../utils/formatters';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
} from 'recharts';
import {
  Cpu,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  LineChart as LineChartIcon,
  Calendar,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { STOCKS, SUPPORTED_FIVE_STOCKS, isSupportedCoreSymbol } from '../data/stocks';

export const Predictions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || '^NSEI';
  const [symbol, setSymbol] = useState(initialSymbol);
  const [buyThreshold, setBuyThreshold] = useState(1.0);
  const [sellThreshold, setSellThreshold] = useState(-1.0);

  useEffect(() => {
    const sym = searchParams.get('symbol');
    if (sym && sym !== symbol) {
      setSymbol(sym);
    }
  }, [searchParams, symbol]);

  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadData = useCallback(async (sym = symbol, buyThr = buyThreshold, sellThr = sellThreshold) => {
    setLoading(true);
    try {
      const [predRes, histRes, metRes] = await Promise.all([
        stockAPI.getPrediction(sym, { buyThreshold: buyThr, sellThreshold: sellThr }),
        stockAPI.getHistory(sym, '3M'),
        stockAPI.getModelMetrics(sym),
      ]);
      setPrediction(predRes);
      setHistory(Array.isArray(histRes?.history) ? histRes.history : []);
      setMetrics(metRes);
    } catch (err) {
      console.error('Error loading prediction page data:', err);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }, [symbol, buyThreshold, sellThreshold]);

  useEffect(() => {
    loadData(symbol, buyThreshold, sellThreshold);
  }, [symbol, loadData]);

  const handleRunForecast = e => {
    e.preventDefault();
    setUpdating(true);
    loadData(symbol, buyThreshold, sellThreshold);
  };

  const applyThresholdPreset = (buyVal, sellVal) => {
    setBuyThreshold(buyVal);
    setSellThreshold(sellVal);
    setUpdating(true);
    loadData(symbol, buyVal, sellVal);
  };

  const isVerified = Boolean(
    prediction?.ml_verified &&
      prediction?.predicted_next_close !== null &&
      prediction?.predicted_next_close !== undefined
  );

  // Recent observed sessions + single next-session anchor ONLY when verified
  const trajectoryData = useMemo(() => {
    const safeHist = Array.isArray(history) ? history : [];
    const recent = safeHist.slice(-25).map(item => ({
      date: item.date,
      actualClose: item.close,
      nextSessionTarget: null,
    }));

    if (recent.length > 0 && isVerified) {
      const last = recent[recent.length - 1];
      recent[recent.length - 1] = {
        ...last,
        nextSessionTarget: last.actualClose,
      };
      recent.push({
        date: 'Next Session',
        actualClose: null,
        nextSessionTarget: Number(prediction.predicted_next_close),
      });
    }

    return recent;
  }, [history, isVerified, prediction]);

  const signal = isVerified ? String(prediction?.signal || 'HOLD').toUpperCase() : 'UNAVAILABLE';
  const isBuy = signal === 'BUY';
  const isSell = signal === 'SELL';
  const signalColor = isBuy ? 'text-[#31E981]' : isSell ? 'text-[#FF586A]' : 'text-[#4D8DFF]';
  const deltaPct = isVerified && prediction?.predicted_change_percent != null
    ? Number(prediction.predicted_change_percent)
    : null;
  const isPositiveMove = deltaPct != null ? deltaPct >= 0 : true;

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title="Next-Session AI Predictions"
          onSelectSymbol={newSym => {
            setSymbol(newSym);
            setSearchParams({ symbol: newSym });
          }}
          currentSymbol={symbol}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Page Header & Configuration Form */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <Cpu className="w-5 h-5 text-[#31E981]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#31E981]/12 text-[#31E981] border border-[#31E981]/30">
                  AI Prediction Lab
                </span>
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Next-Session Closing Price Forecast
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0]">
                Single-step next trading session close inference powered by trained ML pipelines with interactive threshold sensitivity controls.
              </p>
            </div>

            <form onSubmit={handleRunForecast} className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-2 bg-[#10182B] p-1.5 rounded-xl border border-[rgba(125,160,255,0.2)]">
                <span className="text-xs font-mono text-[#7B8AA8] ml-2">Asset:</span>
                <select
                  value={symbol}
                  onChange={e => {
                    const newSym = e.target.value;
                    setSymbol(newSym);
                    setSearchParams({ symbol: newSym });
                  }}
                  className="bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#F8FAFF] focus:outline-none max-w-[220px]"
                >
                  <optgroup label="Core ML Supported Assets (5)">
                    {SUPPORTED_FIVE_STOCKS.map(s => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol} ({s.label})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Extended Market Quotes (No ML Inference)">
                    {STOCKS.filter(s => !s.isSupportedCore).map(s => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol} ({s.name})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Configurable Threshold Inputs */}
              <div className="flex items-center gap-2 bg-[#10182B] p-1.5 rounded-xl border border-[rgba(125,160,255,0.2)] text-xs font-mono">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#38D9F5] ml-1.5" />
                <label className="flex items-center gap-1 text-[#7B8AA8]">
                  <span>BUY&gt;</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={buyThreshold}
                    onChange={e => setBuyThreshold(e.target.value)}
                    className="w-14 bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-lg px-1.5 py-1 text-[#31E981] font-bold text-center focus:outline-none"
                  />
                  <span>%</span>
                </label>
                <label className="flex items-center gap-1 text-[#7B8AA8]">
                  <span>SELL&lt;</span>
                  <input
                    type="number"
                    step="0.1"
                    min="-20"
                    max="0"
                    value={sellThreshold}
                    onChange={e => setSellThreshold(e.target.value)}
                    className="w-14 bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-lg px-1.5 py-1 text-[#FF586A] font-bold text-center focus:outline-none"
                  />
                  <span>%</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={updating || loading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] hover:shadow-bullGlow text-[#070B1A] text-xs font-extrabold transition-all flex items-center space-x-2 disabled:opacity-50 whitespace-nowrap"
              >
                <Zap className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                <span>{updating ? 'Running...' : 'Run Next-Session Inference'}</span>
              </button>
            </form>
          </div>

          {/* Core 5 Quick Selector & Interactive AI Lab Threshold Bar */}
          <div className="bull-card p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-[#7B8AA8] mr-1">
                  Supported ML Assets:
                </span>
                {SUPPORTED_FIVE_STOCKS.map(item => {
                  const active = symbol === item.symbol;
                  return (
                    <button
                      type="button"
                      key={item.symbol}
                      onClick={() => {
                        setSymbol(item.symbol);
                        setSearchParams({ symbol: item.symbol });
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all border whitespace-nowrap ${
                        active
                          ? 'bg-[#31E981]/15 text-[#31E981] border-[#31E981]/45 font-bold'
                          : 'bg-[#10182B] text-[#AAB7D0] border-[rgba(125,160,255,0.18)] hover:border-[#38D9F5]/45 hover:text-[#F8FAFF]'
                      }`}
                    >
                      {item.shortLabel}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <span className="text-[#7B8AA8] mr-1">Presets:</span>
                {[
                  { label: 'Sensitive (±0.5%)', buy: 0.5, sell: -0.5 },
                  { label: 'Balanced (±1.0%)', buy: 1.0, sell: -1.0 },
                  { label: 'Conservative (±2.0%)', buy: 2.0, sell: -2.0 },
                ].map(p => {
                  const isCurrent = Number(buyThreshold) === p.buy && Number(sellThreshold) === p.sell;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyThresholdPreset(p.buy, p.sell)}
                      className={`px-2.5 py-1 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-[#38D9F5]/15 text-[#38D9F5] border-[#38D9F5]/40 font-bold'
                          : 'bg-[#070B1A] text-[#AAB7D0] border-[rgba(125,160,255,0.18)] hover:text-[#F8FAFF]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[rgba(125,160,255,0.14)] text-xs font-mono">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#AAB7D0]">BUY Threshold (Predicted Move &gt;)</span>
                  <span className="font-bold text-[#31E981]">+{Number(buyThreshold).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="5"
                  step="0.1"
                  value={buyThreshold}
                  onChange={e => setBuyThreshold(Number(e.target.value))}
                  className="w-full accent-[#31E981] cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#AAB7D0]">SELL Threshold (Predicted Move &lt;)</span>
                  <span className="font-bold text-[#FF586A]">{Number(sellThreshold).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="-0.2"
                  step="0.1"
                  value={sellThreshold}
                  onChange={e => setSellThreshold(Number(e.target.value))}
                  className="w-full accent-[#FF586A] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Primary Forecast Cards or Honest Unavailable State */}
          {loading && !prediction ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bull-card p-6 h-36 animate-pulse bg-[#10182B]/70" />
              ))}
            </div>
          ) : !isVerified ? (
            <UnavailableState
              title="Live market data or AI prediction is currently unavailable."
              description={
                !isSupportedCoreSymbol(symbol)
                  ? `${symbol} is not in the 5 trained ML assets (^NSEI, RELIANCE.NS, TCS.NS, INFY.NS, HDFCBANK.NS).`
                  : prediction?.message || 'The trained ML inference backend is currently unavailable or awaiting exported model artifacts.'
              }
              onRetry={() => loadData(symbol, buyThreshold, sellThreshold)}
              retrying={updating}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Next-Session Predicted Price */}
              <div className="bull-card p-5 sm:p-6 space-y-2 border-[#31E981]/30">
                <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">
                  Predicted Next-Session Close
                </span>
                <div className="text-3xl font-extrabold font-mono text-[#31E981] tabular-nums tracking-tight">
                  {formatAssetPrice(prediction.predicted_next_close, symbol)}
                </div>
                <p className="text-[11px] text-[#AAB7D0] font-mono tabular-nums">
                  Last Observed ({prediction.last_observed_date || 'Latest'}):{' '}
                  <strong className="text-[#F8FAFF]">
                    {formatAssetPrice(prediction.last_observed_close, symbol)}
                  </strong>
                </p>
              </div>

              {/* Expected Percentage Delta */}
              <div className="bull-card p-5 sm:p-6 space-y-2">
                <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">Predicted Next-Session Move</span>
                <div
                  className={`text-3xl font-extrabold font-mono tabular-nums flex items-center ${
                    isPositiveMove ? 'text-[#31E981]' : 'text-[#FF586A]'
                  }`}
                >
                  {isPositiveMove ? <ArrowUpRight className="w-6 h-6 mr-1" /> : <ArrowDownRight className="w-6 h-6 mr-1" />}
                  {formatSignedPercent(deltaPct)}
                </div>
                <p className="text-[11px] text-[#7B8AA8] font-mono">
                  Single-step next session closing delta
                </p>
              </div>

              {/* Signal & Threshold Rule */}
              <div className="bull-card p-5 sm:p-6 space-y-2">
                <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">Experimental Signal</span>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-extrabold font-display tracking-tight ${signalColor}`}>
                    {signal}
                  </span>
                  <span className="text-xs font-mono text-[#AAB7D0]">
                    · {prediction.trend || 'NEUTRAL'}
                  </span>
                </div>
                <p className="text-[11px] text-[#7B8AA8] font-mono tabular-nums">
                  Rule: BUY &gt; +{prediction.signal_thresholds?.buy_gt_pct ?? buyThreshold}% · SELL &lt; {prediction.signal_thresholds?.sell_lt_pct ?? sellThreshold}%
                </p>
              </div>

              {/* Model & Provenance */}
              <div className="bull-card p-5 sm:p-6 space-y-2">
                <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">Selected ML Model</span>
                <div className="text-base font-extrabold font-display text-[#38D9F5] leading-snug pt-0.5">
                  {prediction.selected_model || 'Verified Model'}
                </div>
                <div className="space-y-0.5 text-[11px] text-[#7B8AA8] font-mono pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#31E981]" />
                    <span>Updated: <strong className="text-[#AAB7D0]">{formatTimestamp(prediction.data_freshness?.fetched_at)}</strong></span>
                  </div>
                  {prediction.training_cutoff_date && (
                    <div>Cutoff: <strong className="text-[#AAB7D0]">{prediction.training_cutoff_date}</strong></div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Observed Closing Context + Single Next-Session Target Chart */}
          <ChartContainer
            title={`Observed Close & Next-Session Target (${symbol})`}
            subtitle="Recent observed daily closing prices connected to the verified next-session prediction"
            icon={LineChartIcon}
            badgeText={isVerified ? prediction?.selected_model || 'Verified' : 'Awaiting Inference'}
            loading={loading}
            heightClass="h-80"
            footer={
              <>
                <span>Solid Cyan: Observed Session Close · Green Marker: Verified Next-Session Prediction</span>
                <span className="font-mono">Source: {prediction?.data_freshness?.source || 'Yahoo Finance'}</span>
              </>
            }
          >
            {trajectoryData.length === 0 ? (
              <UnavailableState
                compact
                title="Historical closing context unavailable."
                description="No observed OHLC closing series was returned for this asset."
                onRetry={() => loadData(symbol, buyThreshold, sellThreshold)}
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trajectoryData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => formatShortTick(v, symbol)}
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
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Line
                    type="monotone"
                    dataKey="actualClose"
                    stroke="#38D9F5"
                    strokeWidth={2.4}
                    dot={false}
                    name="Observed Close"
                  />
                  {isVerified && (
                    <Line
                      type="monotone"
                      dataKey="nextSessionTarget"
                      stroke="#31E981"
                      strokeWidth={2.6}
                      strokeDasharray="5 5"
                      dot={{ r: 5, fill: '#31E981', stroke: '#070B1A', strokeWidth: 1.5 }}
                      name="Next-Session Predicted Close"
                    />
                  )}
                  {isVerified && (
                    <ReferenceDot
                      x="Next Session"
                      y={Number(prediction.predicted_next_close)}
                      r={6}
                      fill="#31E981"
                      stroke="#F8FAFF"
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartContainer>

          {/* Full Historical Candlestick (2D + 3D Candles) */}
          <StockChart
            history={history}
            symbol={symbol}
            timeframe="3M"
            loading={loading}
            onRetry={() => loadData(symbol, buyThreshold, sellThreshold)}
          />

          {/* Bottom Grid: Pipeline Metadata & Educational Disclaimer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bull-card p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,255,0.16)]">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#38D9F5]" />
                  <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
                    Feature Engineering &amp; Model Pipeline
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#31E981] font-semibold">
                  14 Quantitative Features · 60-Day Sequence Window
                </span>
              </div>
              <p className="text-xs text-[#AAB7D0] leading-relaxed">
                Each supported asset runs through an aligned preprocessing pipeline combining OHLCV bars, momentum, volatility, moving averages, and lagged return features before predicting the next trading session&apos;s closing price.
                {metrics?.selected_model && (
                  <> Current benchmark winner: <code className="font-mono text-[#38D9F5]">{metrics.selected_model}</code>.</>
                )}
              </p>
            </div>

            <div className="bull-card p-5 sm:p-6 space-y-2 flex flex-col justify-between bg-[#10182B]/80 border-[rgba(255,88,106,0.22)]">
              <div className="flex items-center space-x-2 text-[#38D9F5]">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold font-display uppercase tracking-wider">
                  Experimental Research Notice
                </span>
              </div>
              <p className="text-xs text-[#AAB7D0] leading-relaxed">
                {prediction?.signal_disclaimer || 'Experimental educational signal only. Not financial advice.'} Statistical models cannot anticipate sudden macroeconomic announcements or earnings shocks.
              </p>
            </div>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
};
