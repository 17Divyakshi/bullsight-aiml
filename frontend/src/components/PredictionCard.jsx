import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { formatAssetPrice, formatSignedPercent, formatTimestamp } from '../utils/formatters';

export const PredictionCard = ({
  prediction,
  symbol,
  loading = false,
  onRetry,
}) => {
  if (loading) {
    return (
      <div className="bull-card p-5 sm:p-6 space-y-4 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-4 w-36 bg-[#151F36] rounded" />
          <div className="h-4 w-20 bg-[#151F36] rounded" />
        </div>
        <div className="h-10 w-36 bg-[#151F36] rounded" />
        <div className="h-20 w-full bg-[#151F36] rounded-xl" />
        <div className="h-16 w-full bg-[#151F36] rounded-xl" />
      </div>
    );
  }

  const isVerified = Boolean(prediction?.ml_verified && prediction?.predicted_next_close !== null && prediction?.predicted_next_close !== undefined);
  const buyThr = prediction?.signal_thresholds?.buy_gt_pct ?? 1.0;
  const sellThr = prediction?.signal_thresholds?.sell_lt_pct ?? -1.0;

  if (!prediction || !isVerified) {
    return (
      <div className="bull-card p-5 sm:p-6 space-y-4 flex flex-col justify-between animate-fade-in">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[rgba(125,160,255,0.16)]">
          <div className="flex items-center space-x-2 min-w-0">
            <Cpu className="w-4 h-4 text-[#38D9F5] shrink-0" />
            <h3 className="text-sm font-bold text-[#F8FAFF] font-display truncate">
              Next-Session Forecast · {symbol}
            </h3>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#FF586A]">
            Unavailable
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#10182B] border border-[rgba(255,88,106,0.25)] space-y-2.5 text-center">
          <AlertTriangle className="w-5 h-5 text-[#FF586A] mx-auto" />
          <p className="text-xs font-bold text-[#F8FAFF]">
            Live market data or AI prediction is currently unavailable.
          </p>
          <p className="text-[11px] text-[#AAB7D0] leading-relaxed">
            {prediction?.message || 'Trained model inference for this asset is not currently active.'}
          </p>
          {prediction?.last_observed_close != null && (
            <p className="text-[11px] font-mono text-[#38D9F5] tabular-nums pt-1">
              Last Observed Close ({prediction.last_observed_date || 'Latest'}):{' '}
              <strong>{formatAssetPrice(prediction.last_observed_close, symbol)}</strong>
            </p>
          )}
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-2.5 rounded-xl bg-[#151F36] border border-[rgba(125,160,255,0.22)] hover:border-[#38D9F5]/50 text-xs font-mono font-bold text-[#F8FAFF] flex items-center justify-center space-x-2 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#38D9F5]" />
            <span>Retry Inference</span>
          </button>
        )}

        <div className="pt-2.5 border-t border-[rgba(125,160,255,0.12)] text-[11px] text-[#7B8AA8]">
          Experimental educational signal only. Not financial advice.
        </div>
      </div>
    );
  }

  const signal = String(prediction.signal || 'HOLD').toUpperCase();
  const isBullish = signal === 'BUY';
  const isBearish = signal === 'SELL';
  const deltaPct = Number(prediction.predicted_change_percent ?? 0);
  const isPositiveMove = deltaPct >= 0;

  return (
    <div className="bull-card p-5 sm:p-6 space-y-4 flex flex-col justify-between animate-fade-in">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[rgba(125,160,255,0.16)]">
        <div className="flex items-center space-x-2 min-w-0">
          <Cpu className="w-4 h-4 text-[#31E981] shrink-0" />
          <h3 className="text-sm font-bold text-[#F8FAFF] font-display truncate">
            Next-Session Forecast · {symbol}
          </h3>
        </div>
        <span className="text-[10px] font-mono font-semibold text-[#31E981]">
          Verified Model
        </span>
      </div>

      {/* Model & Observed Baseline */}
      <div className="space-y-1.5 text-[11px] font-mono">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#7B8AA8]">Selected Model</span>
          <span className="text-[#38D9F5] font-semibold truncate">
            {prediction.selected_model || 'Trained ML Model'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[#7B8AA8]">
            Latest Close ({prediction.last_observed_date || 'Observed'})
          </span>
          <span className="text-[#F8FAFF] font-bold tabular-nums">
            {formatAssetPrice(prediction.last_observed_close, symbol)}
          </span>
        </div>
      </div>

      {/* Predicted Next-Session Closing Price */}
      <div className="p-4 rounded-xl bg-[#070B1A]/80 border border-[rgba(49,233,129,0.24)] flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B8AA8] block mb-1">
            Target Horizon
          </span>
          <span className="text-xs font-bold font-mono text-[#F8FAFF]">
            Next Trading Session Close
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7B8AA8] block mb-1">
            Predicted Close
          </span>
          <span className="text-2xl font-extrabold font-mono text-[#31E981] tabular-nums tracking-tight">
            {formatAssetPrice(prediction.predicted_next_close, symbol)}
          </span>
        </div>
      </div>

      {/* Signal & Expected Delta */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.16)]">
        <div className="flex items-center space-x-2.5">
          <div
            className={`p-2 rounded-xl border ${
              isBullish
                ? 'bg-[#31E981]/12 border-[#31E981]/30 text-[#31E981]'
                : isBearish
                  ? 'bg-[#FF586A]/12 border-[#FF586A]/30 text-[#FF586A]'
                  : 'bg-[#4D8DFF]/12 border-[#4D8DFF]/30 text-[#4D8DFF]'
            }`}
          >
            {isBearish ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-[10px] text-[#7B8AA8] font-medium block">Signal</span>
            <span
              className={`text-sm font-extrabold font-display tracking-tight ${
                isBullish ? 'text-[#31E981]' : isBearish ? 'text-[#FF586A]' : 'text-[#4D8DFF]'
              }`}
            >
              {signal}
            </span>
          </div>
        </div>

        <div className="text-right flex flex-col justify-center">
          <span className="text-[10px] text-[#7B8AA8] font-medium block">Predicted Move</span>
          <span
            className={`text-sm font-bold font-mono tabular-nums flex items-center justify-end ${
              isPositiveMove ? 'text-[#31E981]' : 'text-[#FF586A]'
            }`}
          >
            {isPositiveMove ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
            {formatSignedPercent(deltaPct)}
          </span>
        </div>
      </div>

      {/* Threshold & Provenance */}
      <div className="space-y-1 text-[11px] font-mono text-[#7B8AA8] pt-1">
        <div className="flex justify-between">
          <span>Signal Thresholds</span>
          <span className="text-[#AAB7D0] tabular-nums">
            BUY &gt; +{buyThr}% · SELL &lt; {sellThr}%
          </span>
        </div>
        {prediction.training_cutoff_date && (
          <div className="flex justify-between">
            <span>Training Cutoff</span>
            <span className="text-[#AAB7D0] tabular-nums">{prediction.training_cutoff_date}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#38D9F5]" />
            <span>Source</span>
          </span>
          <span className="text-[#AAB7D0] truncate max-w-[170px]">
            {prediction.data_freshness?.source || 'Yahoo Finance'} · {formatTimestamp(prediction.data_freshness?.fetched_at)}
          </span>
        </div>
      </div>

      {/* Mandatory Educational Disclaimer */}
      <div className="pt-2.5 border-t border-[rgba(125,160,255,0.12)] flex items-start space-x-2 text-[11px] text-[#7B8AA8]">
        <AlertTriangle className="w-3.5 h-3.5 text-[#38D9F5] shrink-0 mt-0.5" />
        <span>
          {prediction.signal_disclaimer || 'Experimental educational signal only. Not financial advice.'}
        </span>
      </div>
    </div>
  );
};
