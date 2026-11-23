import React, { useState, useMemo, Suspense, lazy } from 'react';
import createPlotlyComponent from 'react-plotly.js/factory';
import Plotly from 'plotly.js-dist-min';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
} from 'recharts';
import { Activity, CandlestickChart, Box } from 'lucide-react';
import { UnavailableState } from './UnavailableState';
import { formatAssetPrice, formatShortTick } from '../utils/formatters';

const Candlestick3DChart = lazy(() => import('./three/Candlestick3DChart'));

let PlotComponent = null;
try {
  const factory = typeof createPlotlyComponent === 'function'
    ? createPlotlyComponent
    : createPlotlyComponent?.default;
  const p = Plotly?.default || Plotly;
  if (factory && p) {
    PlotComponent = factory(p);
  }
} catch (e) {
  console.warn('Plotly initialization warning:', e);
}

export const StockChart = ({
  history = [],
  symbol = '^NSEI',
  timeframe = '3M',
  onTimeframeChange,
  loading = false,
  onRetry,
  defaultView = 'plotly',
}) => {
  const PlotComp = PlotComponent;

  const safeHistory = useMemo(() => {
    if (Array.isArray(history)) return history;
    if (history && Array.isArray(history.history)) return history.history;
    return [];
  }, [history]);

  const initialMode =
    defaultView === '3d'
      ? '3d'
      : PlotComponent
        ? 'plotly'
        : 'recharts';

  const [chartMode, setChartMode] = useState(initialMode);
  const [chartType, setChartType] = useState('candlestick');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'MAX'];

  const colors = useMemo(
    () => ({
      bg: '#10182B',
      text: '#F8FAFF',
      muted: '#7B8AA8',
      grid: 'rgba(125, 160, 255, 0.12)',
      cyan: '#38D9F5',
      blue: '#4D8DFF',
      purple: '#9065FF',
      positive: '#31E981',
      negative: '#FF586A',
    }),
    []
  );

  const plotlyData = useMemo(() => {
    if (!safeHistory || safeHistory.length === 0) return [];

    const dates = safeHistory.map(d => d.date);
    const opens = safeHistory.map(d => d.open ?? d.close);
    const highs = safeHistory.map(d => d.high ?? d.close);
    const lows = safeHistory.map(d => d.low ?? d.close);
    const closes = safeHistory.map(d => d.close);
    const volumes = safeHistory.map(d => d.volume || 0);
    const sma20s = safeHistory.map(d => d.sma20);
    const sma50s = safeHistory.map(d => d.sma50);

    const traces = [];

    if (chartType === 'candlestick') {
      traces.push({
        type: 'candlestick',
        x: dates,
        open: opens,
        high: highs,
        low: lows,
        close: closes,
        name: symbol,
        yaxis: 'y',
        increasing: { line: { color: colors.positive, width: 1.5 }, fillcolor: colors.positive },
        decreasing: { line: { color: colors.negative, width: 1.5 }, fillcolor: colors.negative },
        hoverinfo: 'x+y+text',
        hoverlabel: { bgcolor: colors.bg, font: { color: colors.text, family: 'JetBrains Mono' } },
      });
    } else {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: dates,
        y: closes,
        name: `${symbol} Close`,
        yaxis: 'y',
        line: { color: colors.cyan, width: 2.3 },
        fill: 'tozeroy',
        fillcolor: 'rgba(56, 217, 245, 0.14)',
        hoverlabel: { bgcolor: colors.bg, font: { color: colors.text, family: 'JetBrains Mono' } },
      });
    }

    if (showSMA20) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: dates,
        y: sma20s,
        name: 'SMA 20',
        yaxis: 'y',
        line: { color: colors.blue, width: 1.6, dash: 'dot' },
        hoverinfo: 'name+y',
      });
    }

    if (showSMA50) {
      traces.push({
        type: 'scatter',
        mode: 'lines',
        x: dates,
        y: sma50s,
        name: 'SMA 50',
        yaxis: 'y',
        line: { color: colors.purple, width: 1.6 },
        hoverinfo: 'name+y',
      });
    }

    if (showVolume) {
      const volumeColors = closes.map((c, i) => {
        if (i === 0) return 'rgba(56, 217, 245, 0.32)';
        return c >= closes[i - 1]
          ? 'rgba(49, 233, 129, 0.34)'
          : 'rgba(255, 88, 106, 0.34)';
      });

      traces.push({
        type: 'bar',
        x: dates,
        y: volumes,
        name: 'Volume',
        yaxis: 'y2',
        marker: { color: volumeColors },
        hoverinfo: 'x+y',
      });
    }

    return traces;
  }, [safeHistory, symbol, chartType, showSMA20, showSMA50, showVolume, colors]);

  const plotlyLayout = useMemo(
    () => ({
      autosize: true,
      height: 410,
      margin: { t: 18, r: 22, l: 54, b: 32 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.12,
        font: { color: colors.muted, size: 10, family: 'JetBrains Mono' },
      },
      dragmode: 'zoom',
      xaxis: {
        type: 'date',
        rangeslider: { visible: false },
        gridcolor: colors.grid,
        color: colors.muted,
        tickfont: { family: 'JetBrains Mono', size: 10, color: colors.muted },
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: colors.cyan,
      },
      yaxis: {
        domain: showVolume ? [0.26, 1] : [0, 1],
        gridcolor: colors.grid,
        color: colors.muted,
        tickfont: { family: 'JetBrains Mono', size: 10, color: colors.muted },
        tickformat: '.2f',
        spikemode: 'across',
        spikethickness: 1,
        spikedash: 'dot',
        spikecolor: colors.cyan,
      },
      yaxis2: {
        domain: [0, 0.2],
        gridcolor: colors.grid,
        color: colors.muted,
        showticklabels: false,
        visible: showVolume,
      },
    }),
    [colors, showVolume]
  );

  const plotlyConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d'],
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#10182B] border border-[rgba(125,160,255,0.28)] rounded-xl p-3 shadow-cardHover text-xs font-mono space-y-1.5 z-50">
          <p className="font-bold text-[#F8FAFF] border-b border-[rgba(125,160,255,0.16)] pb-1">{label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] tabular-nums">
            <span className="text-[#7B8AA8]">Close:</span>
            <span className="font-bold text-[#38D9F5]">{formatAssetPrice(data.close, symbol)}</span>
            <span className="text-[#7B8AA8]">Open:</span>
            <span className="text-[#F8FAFF]">{formatAssetPrice(data.open ?? data.close, symbol)}</span>
            <span className="text-[#7B8AA8]">High:</span>
            <span className="text-[#31E981]">{formatAssetPrice(data.high ?? data.close, symbol)}</span>
            <span className="text-[#7B8AA8]">Low:</span>
            <span className="text-[#FF586A]">{formatAssetPrice(data.low ?? data.close, symbol)}</span>
            {data.sma20 != null && (
              <>
                <span className="text-[#7B8AA8]">SMA 20:</span>
                <span className="text-[#4D8DFF]">{formatAssetPrice(data.sma20, symbol)}</span>
              </>
            )}
            {data.sma50 != null && (
              <>
                <span className="text-[#7B8AA8]">SMA 50:</span>
                <span className="text-[#9065FF]">{formatAssetPrice(data.sma50, symbol)}</span>
              </>
            )}
            {data.volume != null && (
              <>
                <span className="text-[#7B8AA8]">Volume:</span>
                <span className="text-[#AAB7D0]">{Number(data.volume).toLocaleString()}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bull-card p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-[rgba(125,160,255,0.16)]">
          <div className="h-4 w-48 bg-[#151F36] rounded animate-pulse" />
          <div className="h-8 w-64 bg-[#151F36] rounded-xl animate-pulse" />
        </div>
        <div className="h-[410px] w-full bg-[#10182B]/70 rounded-xl animate-pulse flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
          Loading historical OHLC series...
        </div>
      </div>
    );
  }

  return (
    <div className="bull-card p-5 sm:p-6 space-y-4 animate-fade-in">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-[#31E981] shrink-0" />
            <h3 className="text-sm font-bold text-[#F8FAFF] font-display tracking-tight">
              {symbol} Price &amp; Technical Chart
            </h3>
          </div>

          <div className="flex items-center bg-[#070B1A] p-0.5 rounded-xl border border-[rgba(125,160,255,0.2)] text-[11px] font-mono">
            {PlotComp && (
              <button
                type="button"
                onClick={() => setChartMode('plotly')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  chartMode === 'plotly'
                    ? 'bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A] font-bold'
                    : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                }`}
              >
                2D Candles
              </button>
            )}
            <button
              type="button"
              onClick={() => setChartMode('recharts')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                chartMode === 'recharts'
                  ? 'bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A] font-bold'
                  : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
              }`}
            >
              Area
            </button>
            <button
              type="button"
              onClick={() => setChartMode('3d')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all whitespace-nowrap inline-flex items-center gap-1 ${
                chartMode === '3d'
                  ? 'bg-gradient-to-r from-[#4D8DFF] to-[#9065FF] text-[#F8FAFF] font-bold'
                  : 'text-[#7B8AA8] hover:text-[#38D9F5]'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>3D Candles</span>
            </button>
          </div>

          {chartMode === 'plotly' && PlotComp && (
            <button
              type="button"
              onClick={() => setChartType(prev => (prev === 'candlestick' ? 'area' : 'candlestick'))}
              className="px-2.5 py-1 rounded-lg border border-[rgba(125,160,255,0.2)] bg-[#10182B] text-[#AAB7D0] hover:text-[#38D9F5] hover:border-[#38D9F5]/40 transition-all text-[11px] font-mono flex items-center space-x-1.5 whitespace-nowrap"
              title="Toggle Candlestick vs Line Area"
            >
              <CandlestickChart className="w-3.5 h-3.5 text-[#31E981]" />
              <span className="capitalize">{chartType}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onTimeframeChange && (
            <div className="flex bg-[#070B1A] p-1 rounded-xl border border-[rgba(125,160,255,0.18)]">
              {TIMEFRAMES.map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-2 sm:px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg transition-all whitespace-nowrap ${
                    timeframe === tf
                      ? 'bg-[#4D8DFF] text-[#F8FAFF] shadow-sm'
                      : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}

          {chartMode !== '3d' && (
            <div className="flex items-center space-x-1 bg-[#070B1A] p-1 rounded-xl border border-[rgba(125,160,255,0.18)]">
              <button
                type="button"
                onClick={() => setShowSMA20(!showSMA20)}
                className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all whitespace-nowrap ${
                  showSMA20
                    ? 'bg-[#4D8DFF]/20 text-[#4D8DFF] border border-[#4D8DFF]/35 font-bold'
                    : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                }`}
              >
                SMA 20
              </button>
              <button
                type="button"
                onClick={() => setShowSMA50(!showSMA50)}
                className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all whitespace-nowrap ${
                  showSMA50
                    ? 'bg-[#9065FF]/20 text-[#9065FF] border border-[#9065FF]/35 font-bold'
                    : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                }`}
              >
                SMA 50
              </button>
              <button
                type="button"
                onClick={() => setShowVolume(!showVolume)}
                className={`px-2 py-1 text-[11px] font-mono font-semibold rounded-lg transition-all whitespace-nowrap ${
                  showVolume
                    ? 'bg-[#38D9F5]/20 text-[#38D9F5] border border-[#38D9F5]/35 font-bold'
                    : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                }`}
              >
                Volume
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full min-h-[410px]">
        {safeHistory.length === 0 ? (
          <UnavailableState
            compact
            title="Live market data or AI prediction is currently unavailable."
            description={`No observed historical OHLC candles were returned for ${symbol}.`}
            onRetry={onRetry}
          />
        ) : chartMode === '3d' ? (
          <Suspense
            fallback={
              <div className="h-[410px] w-full rounded-2xl bg-[#070B1A] border border-[rgba(125,160,255,0.18)] flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
                Initializing 3D Candlestick Engine...
              </div>
            }
          >
            <Candlestick3DChart
              history={safeHistory}
              symbol={symbol}
              loading={loading}
              onRetry={onRetry}
            />
          </Suspense>
        ) : chartMode === 'plotly' && PlotComp ? (
          <div className="w-full h-[410px]">
            <PlotComp
              data={plotlyData}
              layout={plotlyLayout}
              config={plotlyConfig}
              style={{ width: '100%', height: '100%' }}
              useResizeHandler={true}
            />
          </div>
        ) : (
          <div className="w-full h-80 sm:h-[410px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={safeHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCloseCyber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38D9F5" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="#4D8DFF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: colors.muted, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="price"
                  domain={['auto', 'auto']}
                  tick={{ fill: colors.muted, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => formatShortTick(val, symbol)}
                />
                {showVolume && (
                  <YAxis
                    yAxisId="volume"
                    orientation="right"
                    domain={[0, dataMax => dataMax * 4]}
                    hide={true}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />

                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#38D9F5"
                  strokeWidth={2.3}
                  fillOpacity={1}
                  fill="url(#colorCloseCyber)"
                />

                {showSMA20 && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma20"
                    stroke="#4D8DFF"
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 4"
                  />
                )}

                {showSMA50 && (
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="sma50"
                    stroke="#9065FF"
                    strokeWidth={1.5}
                    dot={false}
                  />
                )}

                {showVolume && (
                  <Bar yAxisId="volume" dataKey="volume" fill="#31E981" opacity={0.22} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
