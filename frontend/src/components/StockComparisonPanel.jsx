import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { stockAPI } from '../services/api';
import { STOCKS, SUPPORTED_FIVE_STOCKS } from '../data/stocks';
import { UnavailableState } from './UnavailableState';
import { formatAssetPrice, formatSignedPercent } from '../utils/formatters';
import { GitCompare, RefreshCw } from 'lucide-react';

const LINE_COLORS = ['#31E981', '#38D9F5', '#9065FF'];

export const StockComparisonPanel = () => {
  const [symA, setSymA] = useState('^NSEI');
  const [symB, setSymB] = useState('RELIANCE.NS');
  const [symC, setSymC] = useState('TCS.NS');
  const [timeframe, setTimeframe] = useState('3M');
  const [seriesMap, setSeriesMap] = useState({});
  const [summaryMap, setSummaryMap] = useState({});
  const [loading, setLoading] = useState(true);

  const selectedList = useMemo(() => {
    const raw = [symA, symB, symC].filter(Boolean);
    return [...new Set(raw)];
  }, [symA, symB, symC]);

  const loadComparison = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        selectedList.map(async sym => {
          const [hist, sum] = await Promise.all([
            stockAPI.getHistory(sym, timeframe),
            stockAPI.getSummary(sym),
          ]);
          return { sym, hist: hist?.history || [], sum };
        })
      );
      const nextSeries = {};
      const nextSummary = {};
      results.forEach(({ sym, hist, sum }) => {
        nextSeries[sym] = hist;
        nextSummary[sym] = sum;
      });
      setSeriesMap(nextSeries);
      setSummaryMap(nextSummary);
    } finally {
      setLoading(false);
    }
  }, [selectedList, timeframe]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  // Normalize all selected assets to % return from first observed session in range
  const normalizedData = useMemo(() => {
    const dateSet = new Map();
    selectedList.forEach(sym => {
      const rows = seriesMap[sym] || [];
      if (rows.length === 0) return;
      const base = Number(rows[0].close || 0);
      if (!base) return;
      rows.forEach(r => {
        if (!dateSet.has(r.date)) {
          dateSet.set(r.date, { date: r.date });
        }
        const entry = dateSet.get(r.date);
        entry[sym] = Number((((Number(r.close) - base) / base) * 100).toFixed(2));
      });
    });
    return Array.from(dateSet.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedList, seriesMap]);

  const periodStats = useMemo(() => {
    return selectedList.map((sym, idx) => {
      const rows = seriesMap[sym] || [];
      const sum = summaryMap[sym];
      const periodPct =
        rows.length >= 2 && rows[0].close
          ? ((Number(rows[rows.length - 1].close) - Number(rows[0].close)) / Number(rows[0].close)) * 100
          : null;
      return {
        symbol: sym,
        color: LINE_COLORS[idx % LINE_COLORS.length],
        price: sum?.isLive ? sum.price : null,
        dayChangePct: sum?.isLive ? sum.changePercent : null,
        periodPct,
        volume: sum?.volume || 'N/A',
      };
    });
  }, [selectedList, seriesMap, summaryMap]);

  const anyHistory = normalizedData.length > 0;

  return (
    <div className="bull-card p-5 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-[#31E981]" />
            <h3 className="text-sm sm:text-base font-bold font-display text-[#F8FAFF]">
              Interactive Multi-Stock Comparison
            </h3>
          </div>
          <p className="text-xs text-[#AAB7D0]">
            Compare normalized percentage return trajectories across NIFTY 50, NSE leaders, and global benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#070B1A] p-1 rounded-xl border border-[rgba(125,160,255,0.18)] text-[11px] font-mono">
            {['1M', '3M', '6M', '1Y'].map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  timeframe === tf ? 'bg-[#4D8DFF] text-[#F8FAFF]' : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadComparison}
            disabled={loading}
            className="p-2 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.2)] text-[#38D9F5] hover:border-[#31E981]/45 transition-all"
            title="Refresh Comparison"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Asset Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        {[
          { label: 'Asset A (Emerald)', value: symA, setter: setSymA, allowEmpty: false, dot: '#31E981' },
          { label: 'Asset B (Cyan)', value: symB, setter: setSymB, allowEmpty: false, dot: '#38D9F5' },
          { label: 'Asset C (Purple)', value: symC, setter: setSymC, allowEmpty: true, dot: '#9065FF' },
        ].map(sel => (
          <div key={sel.label} className="p-3 rounded-xl bg-[#070B1A]/75 border border-[rgba(125,160,255,0.16)] space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sel.dot }} />
              <span className="text-[10px] text-[#7B8AA8] uppercase">{sel.label}</span>
            </div>
            <select
              value={sel.value}
              onChange={e => sel.setter(e.target.value)}
              className="w-full bg-[#10182B] border border-[rgba(125,160,255,0.2)] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#F8FAFF] focus:outline-none focus:border-[#38D9F5]"
            >
              {sel.allowEmpty && <option value="">None (2-asset comparison)</option>}
              <optgroup label="Core NSE Assets">
                {SUPPORTED_FIVE_STOCKS.map(s => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} ({s.shortLabel})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Extended Market">
                {STOCKS.filter(s => !s.isSupportedCore).map(s => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} ({s.name})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        ))}
      </div>

      {/* Normalized Performance Chart */}
      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full w-full rounded-xl bg-[#10182B] animate-pulse flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
            Aligning historical series across selected assets...
          </div>
        ) : !anyHistory ? (
          <UnavailableState
            compact
            title="Live market data or AI prediction is currently unavailable."
            description="Historical closing series could not be loaded for the selected tickers."
            onRetry={loadComparison}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={normalizedData} margin={{ top: 10, right: 14, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} minTickGap={24} />
              <YAxis
                tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickFormatter={v => `${v >= 0 ? '+' : ''}${v}%`}
              />
              <ReferenceLine y={0} stroke="rgba(125,160,255,0.3)" strokeDasharray="3 3" />
              <Tooltip
                formatter={(val, name) => [`${Number(val) >= 0 ? '+' : ''}${Number(val).toFixed(2)}%`, name]}
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
              {selectedList.map((sym, idx) => (
                <Line
                  key={sym}
                  type="monotone"
                  dataKey={sym}
                  stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                  strokeWidth={2.3}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Side-by-Side KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {periodStats.map(stat => (
          <div
            key={stat.symbol}
            className="p-4 rounded-xl bg-[#070B1A]/75 border border-[rgba(125,160,255,0.16)] space-y-2 text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stat.color }} />
                <span className="font-bold text-[#F8FAFF]">{stat.symbol}</span>
              </div>
              <span className="text-[#7B8AA8]">{timeframe} Return</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-extrabold text-[#F8FAFF] tabular-nums">
                {stat.price != null ? formatAssetPrice(stat.price, stat.symbol) : 'Unavailable'}
              </span>
              <span
                className={`font-bold tabular-nums ${
                  stat.periodPct == null
                    ? 'text-[#7B8AA8]'
                    : stat.periodPct >= 0
                      ? 'text-[#31E981]'
                      : 'text-[#FF586A]'
                }`}
              >
                {stat.periodPct != null ? formatSignedPercent(stat.periodPct) : 'N/A'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
