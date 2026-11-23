import React from 'react';
import { Newspaper, Info } from 'lucide-react';
import { UnavailableState } from './UnavailableState';

export const NewsCard = ({ newsData, loading = false, onRetry }) => {
  const articles = newsData?.articles || [];

  if (loading) {
    return (
      <div className="bull-card p-5 sm:p-6 space-y-4 animate-pulse">
        <div className="h-4 w-44 bg-[#151F36] rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 w-full bg-[#151F36]/70 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!newsData || articles.length === 0) {
    return (
      <UnavailableState
        compact
        title="Market news feed is currently unavailable."
        description={newsData?.message || 'Unable to retrieve financial headlines from the backend service.'}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="bull-card p-5 sm:p-6 space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[rgba(125,160,255,0.16)]">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-4 h-4 text-[#38D9F5]" />
          <h3 className="text-sm font-bold text-[#F8FAFF] font-display tracking-tight">
            Market News &amp; Sentiment Feed
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#7B8AA8]">
          {newsData?.configured ? 'Live News API Feed' : 'Curated Sample Headlines'}
        </span>
      </div>

      {!newsData?.configured && (
        <div className="p-3.5 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.16)] text-xs text-[#AAB7D0] flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-[#38D9F5] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            {newsData?.message || 'Showing curated sample headlines because external NEWS_API_KEY is not configured. Core market charting and next-session forecasting run independently.'}
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {articles.map(item => {
          const isPos = item.sentiment === 'POSITIVE';
          const isNeg = item.sentiment === 'NEGATIVE';
          return (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-[#10182B]/80 border border-[rgba(125,160,255,0.14)] hover:border-[#38D9F5]/35 hover:bg-[#151F36] transition-all flex flex-col space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFF] leading-snug">
                  {item.title}
                </h4>
                <span
                  className={`text-[11px] font-mono font-bold shrink-0 tabular-nums ${
                    isPos ? 'text-[#31E981]' : isNeg ? 'text-[#FF586A]' : 'text-[#38D9F5]'
                  }`}
                >
                  {item.sentiment} · {Math.round((item.sentimentScore || 0) * 100)}%
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#7B8AA8] pt-1.5 border-t border-[rgba(125,160,255,0.1)]">
                <span>
                  <strong className="text-[#AAB7D0]">{item.source}</strong> · {item.time}
                </span>
                {item.symbol && (
                  <span className="text-[#38D9F5] font-semibold">{item.symbol}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
