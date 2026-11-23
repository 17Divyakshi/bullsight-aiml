import React from 'react';
import { formatAssetPrice } from '../utils/formatters';
import { UnavailableState } from './UnavailableState';

export const IndicatorCard = ({
  indicators,
  symbol = '^NSEI',
  loading = false,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bull-card p-4 space-y-3 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-3 w-20 bg-[#151F36] rounded" />
              <div className="h-3 w-12 bg-[#151F36] rounded" />
            </div>
            <div className="h-6 w-24 bg-[#151F36] rounded" />
            <div className="h-2 w-32 bg-[#151F36]/70 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!indicators || indicators.available === false) {
    return (
      <UnavailableState
        compact
        title="Technical indicators are currently unavailable."
        description="Unable to compute RSI, MACD, SMA, EMA, or Bollinger Bands without observed historical prices."
        onRetry={onRetry}
      />
    );
  }

  const rsiRaw = indicators.rsi?.value;
  const rsiVal = rsiRaw !== null && rsiRaw !== undefined ? Number(rsiRaw) : null;
  const bbRaw = indicators.bollinger?.position;
  const bbPos = bbRaw !== null && bbRaw !== undefined ? Number(bbRaw) * 100 : null;

  const items = [
    {
      name: 'RSI (14-Day)',
      value: rsiVal !== null ? rsiVal.toFixed(2) : 'N/A',
      signal: indicators.rsi?.signal || 'Unavailable',
      desc: 'Momentum gauge (30 oversold · 70 overbought)',
      progress: rsiVal,
      barColor:
        rsiVal !== null && rsiVal > 70
          ? 'bg-[#FF586A]'
          : rsiVal !== null && rsiVal < 30
            ? 'bg-[#31E981]'
            : 'bg-[#38D9F5]',
    },
    {
      name: 'MACD (12, 26, 9)',
      value: indicators.macd?.value != null ? Number(indicators.macd.value).toFixed(2) : 'N/A',
      signal: indicators.macd?.signal || 'Unavailable',
      desc: 'Trend momentum crossover indicator',
    },
    {
      name: 'SMA 20 Overlay',
      value: indicators.sma20?.value != null ? formatAssetPrice(indicators.sma20.value, symbol) : 'N/A',
      signal: indicators.sma20?.signal || 'Unavailable',
      desc: '20-session average closing price',
    },
    {
      name: 'EMA 20 Overlay',
      value: indicators.ema20?.value != null ? formatAssetPrice(indicators.ema20.value, symbol) : 'N/A',
      signal: indicators.ema20?.signal || 'Unavailable',
      desc: 'Exponential weighted recent trend',
    },
    {
      name: 'Bollinger Position',
      value: bbPos !== null ? `${bbPos.toFixed(1)}%` : 'N/A',
      signal: indicators.bollinger?.signal || 'Unavailable',
      desc: 'Position inside volatility envelope',
      progress: bbPos,
      barColor: 'bg-[#4D8DFF]',
    },
  ];

  const getSignalColor = sig => {
    switch (sig?.toUpperCase()) {
      case 'BULLISH':
      case 'BUY':
      case 'OVERSOLD':
        return 'text-[#31E981]';
      case 'BEARISH':
      case 'SELL':
      case 'OVERBOUGHT':
        return 'text-[#FF586A]';
      default:
        return 'text-[#38D9F5]';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="bull-card bull-card-interactive p-4 space-y-2.5 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#AAB7D0] font-display truncate">
              {item.name}
            </span>
            <span className={`text-[11px] font-mono font-bold shrink-0 ${getSignalColor(item.signal)}`}>
              {item.signal}
            </span>
          </div>

          <div>
            <div className="font-mono text-xl font-extrabold text-[#F8FAFF] tabular-nums tracking-tight">
              {item.value}
            </div>

            {typeof item.progress === 'number' && !Number.isNaN(item.progress) && (
              <div className="w-full bg-[#070B1A] rounded-full h-1.5 mt-2 overflow-hidden border border-[rgba(125,160,255,0.16)]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                />
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#7B8AA8] leading-snug">{item.desc}</p>
        </div>
      ))}
    </div>
  );
};
