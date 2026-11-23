import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const UnavailableState = ({
  title = 'Live market data or AI prediction is currently unavailable.',
  description = 'The active market data or inference backend did not return verified values for this asset.',
  onRetry,
  retrying = false,
  compact = false,
}) => {
  return (
    <div
      className={`bull-card text-center flex flex-col items-center justify-center ${
        compact ? 'p-5 space-y-3' : 'p-8 sm:p-10 space-y-4'
      }`}
    >
      <div className="w-11 h-11 rounded-2xl bg-[#FF586A]/12 border border-[#FF586A]/30 text-[#FF586A] flex items-center justify-center">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="space-y-1.5 max-w-lg">
        <h3 className="text-sm sm:text-base font-bold font-display text-[#F8FAFF]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[#AAB7D0] leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="px-4 py-2 rounded-xl bg-[#151F36] border border-[#4D8DFF]/35 hover:border-[#31E981]/50 text-[#F8FAFF] text-xs font-bold font-mono transition-all inline-flex items-center space-x-2 disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#38D9F5] ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Retrying...' : 'Retry'}</span>
        </button>
      )}
    </div>
  );
};
