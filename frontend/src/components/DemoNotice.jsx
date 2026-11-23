import React from 'react';
import { Info, Sparkles } from 'lucide-react';

/**
 * Clean inline status tag for subtle contextual labels.
 */
export const DemoBadge = ({ label = 'AI INSIGHT' }) => (
  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-[#38D9F5]/10 text-[#38D9F5] border border-[#38D9F5]/25 shrink-0 whitespace-nowrap">
    <Sparkles className="w-3 h-3" />
    <span>{label}</span>
  </span>
);

/**
 * Clean informational banner for fintech disclosures and model notes.
 */
export const DemoNotice = ({
  title = 'Intelligent Market Analytics',
  description = 'Quantitative forecasts and technical signals are computed from historical equity prices for market research purposes.',
}) => {
  return (
    <div className="rounded-2xl bg-[#10182B] border border-[rgba(125,160,255,0.18)] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="p-2 rounded-xl bg-[#38D9F5]/10 border border-[#38D9F5]/25 text-[#38D9F5] shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold font-display text-[#F8FAFF]">{title}</h3>
          <p className="text-xs text-[#AAB7D0] leading-relaxed max-w-4xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
