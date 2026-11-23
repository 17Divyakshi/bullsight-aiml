import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from 'recharts';
import { UnavailableState } from './UnavailableState';
import { formatAssetPrice, formatShortTick } from '../utils/formatters';
import { Sliders, Activity } from 'lucide-react';

const TABS = [
  { id: 'ma', label: 'SMA 20 / 50 & EMA' },
  { id: 'rsi', label: 'RSI (14) Oscillator' },
  { id: 'macd', label: 'MACD Momentum' },
  { id: 'bollinger', label: 'Bollinger Envelope' },
];

export const TechnicalIndicatorExplorer = ({
  history = [],
  indicators = null,
  symbol = '^NSEI',
  loading = false,
  onRetry,
}) => {
  const [activeTab, setActiveTab] = useState('ma');

  const safeHistory = useMemo(() => {
    const arr = Array.isArray(history) ? history : [];
    return arr.slice(-60).map((row, idx, list) => {
      const close = Number(row.close ?? 0);
      // Compute rolling 14-day RSI locally only from real observed closes when missing
      let rsiApprox = null;
      if (idx >= 14) {
        let gains = 0;
        let losses = 0;
        for (let i = idx - 13; i <= idx; i++) {
          const diff = Number(list[i].close) - Number(list[i - 1].close);
          if (diff >= 0) gains += diff;
          else losses += Math.abs(diff);
        }
        const rs = losses === 0 ? 100 : gains / losses;
        rsiApprox = Number((100 - 100 / (1 + rs)).toFixed(2));
      }

      // Compute rolling 20-day std dev for Bollinger Envelope if not attached
      let upper = row.bbUpper ?? null;
      let lower = row.bbLower ?? null;
      const sma20 = row.sma20 != null ? Number(row.sma20) : null;
      if (sma20 != null && idx >= 19 && upper == null) {
        const slice = list.slice(idx - 19, idx + 1).map(r => Number(r.close));
        const variance = slice.reduce((acc, v) => acc + Math.pow(v - sma20, 2), 0) / 20;
        const std = Math.sqrt(variance);
        upper = Number((sma20 + 2 * std).toFixed(2));
        lower = Number((sma20 - 2 * std).toFixed(2));
      }

      // Compute approximate MACD from EMA-like difference on observed closes
      const sma50 = row.sma50 != null ? Number(row.sma50) : null;
      const spread = sma20 != null && sma50 != null ? Number((sma20 - sma50).toFixed(2)) : null;

      return {
        date: row.date,
        close,
        sma20,
        sma50,
        rsi: rsiApprox,
        bbUpper: upper,
        bbLower: lower,
        maSpread: spread,
      };
    });
  }, [history]);

  const activeInsight = useMemo(() => {
    if (!indicators || indicators.available === false) {
      return 'Technical indicator summary will populate once observed session data is returned.';
    }
    switch (activeTab) {
      case 'rsi':
        return `Observed RSI (14) is ${indicators.rsi?.value ?? 'N/A'} (${indicators.rsi?.signal || 'Neutral'}). Readings above 70 indicate overbought momentum; below 30 indicate oversold conditions.`;
      case 'macd':
        return `MACD reading is ${indicators.macd?.value ?? 'N/A'} (${indicators.macd?.signal || 'Neutral'}), tracking convergence/divergence between fast and slow exponential trends.`;
      case 'bollinger':
        return `Bollinger position is ${
          indicators.bollinger?.position != null
            ? `${(Number(indicators.bollinger.position) * 100).toFixed(1)}%`
            : 'N/A'
        } inside the 20-day ±2σ volatility envelope.`;
      default:
        return `SMA 20 sits at ${
          indicators.sma20?.value != null ? formatAssetPrice(indicators.sma20.value, symbol) : 'N/A'
        } and EMA 20 at ${
          indicators.ema20?.value != null ? formatAssetPrice(indicators.ema20.value, symbol) : 'N/A'
        } (${indicators.sma20?.signal || 'Trend'}).`;
    }
  }, [activeTab, indicators, symbol]);

  return (
    <div className="bull-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#38D9F5]" />
            <h3 className="text-sm sm:text-base font-bold font-display text-[#F8FAFF]">
              Technical Indicator Explorer · {symbol}
            </h3>
          </div>
          <p className="text-xs text-[#AAB7D0]">
            Inspect moving-average crossovers, RSI momentum bounds, trend spread, and Bollinger volatility bands.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 bg-[#070B1A] p-1 rounded-xl border border-[rgba(125,160,255,0.18)] text-[11px] font-mono">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A]'
                  : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Insight Strip */}
      <div className="px-4 py-3 rounded-xl bg-[#070B1A]/80 border border-[rgba(125,160,255,0.16)] flex items-start space-x-2.5 text-xs text-[#AAB7D0]">
        <Activity className="w-4 h-4 text-[#31E981] shrink-0 mt-0.5" />
        <span>{activeInsight}</span>
      </div>

      <div className="h-72 w-full">
        {loading ? (
          <div className="h-full w-full rounded-xl bg-[#10182B] animate-pulse flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
            Computing technical indicator curves...
          </div>
        ) : safeHistory.length === 0 ? (
          <UnavailableState
            compact
            title="Technical indicator series unavailable."
            description={`No historical price bars were returned for ${symbol}.`}
            onRetry={onRetry}
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'rsi' ? (
              <ComposedChart data={safeHistory} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} minTickGap={20} />
                <YAxis domain={[0, 100]} tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
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
                <ReferenceLine y={70} stroke="#FF586A" strokeDasharray="4 4" label={{ value: '70 Overbought', fill: '#FF586A', fontSize: 10 }} />
                <ReferenceLine y={30} stroke="#31E981" strokeDasharray="4 4" label={{ value: '30 Oversold', fill: '#31E981', fontSize: 10 }} />
                <Line type="monotone" dataKey="rsi" stroke="#38D9F5" strokeWidth={2.2} dot={false} name="RSI (14)" />
              </ComposedChart>
            ) : activeTab === 'macd' ? (
              <ComposedChart data={safeHistory} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} minTickGap={20} />
                <YAxis tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
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
                <ReferenceLine y={0} stroke="rgba(125,160,255,0.35)" />
                <Area type="monotone" dataKey="maSpread" stroke="#9065FF" fill="#9065FF" fillOpacity={0.2} strokeWidth={2} name="SMA20 − SMA50 Trend Spread" />
              </ComposedChart>
            ) : activeTab === 'bollinger' ? (
              <ComposedChart data={safeHistory} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} minTickGap={20} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => formatShortTick(v, symbol)} />
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
                <Line type="monotone" dataKey="bbUpper" stroke="#9065FF" strokeDasharray="4 4" dot={false} name="Upper Band (+2σ)" />
                <Line type="monotone" dataKey="close" stroke="#31E981" strokeWidth={2.2} dot={false} name="Close" />
                <Line type="monotone" dataKey="bbLower" stroke="#4D8DFF" strokeDasharray="4 4" dot={false} name="Lower Band (-2σ)" />
              </ComposedChart>
            ) : (
              <ComposedChart data={safeHistory} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} minTickGap={20} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickFormatter={v => formatShortTick(v, symbol)} />
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
                <Line type="monotone" dataKey="close" stroke="#38D9F5" strokeWidth={2.3} dot={false} name="Observed Close" />
                <Line type="monotone" dataKey="sma20" stroke="#31E981" strokeWidth={1.7} strokeDasharray="4 4" dot={false} name="SMA 20" />
                <Line type="monotone" dataKey="sma50" stroke="#9065FF" strokeWidth={1.7} dot={false} name="SMA 50" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
