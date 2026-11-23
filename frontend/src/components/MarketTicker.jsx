import React, { useEffect, useState } from 'react';
import { stockAPI } from '../services/api';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export const MarketTicker = () => {
  const [items, setItems] = useState([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTicker = async () => {
    setLoading(true);
    try {
      const res = await stockAPI.getMarketOverview();
      setItems(Array.isArray(res?.items) ? res.items : []);
      setAvailable(Boolean(res?.available && res?.items?.length > 0));
    } catch {
      setItems([]);
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicker();
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-[#0A1024] border-b border-[rgba(125,160,255,0.18)] py-2 px-4 flex items-center space-x-2.5 text-xs font-mono text-[#AAB7D0]">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38D9F5]" />
        <span>Loading market index snapshot...</span>
      </div>
    );
  }

  if (!available || items.length === 0) {
    return (
      <div className="w-full bg-[#0A1024] border-b border-[rgba(125,160,255,0.18)] py-2 px-4 flex items-center justify-between text-xs font-mono text-[#7B8AA8]">
        <span>Market index feed is currently unavailable.</span>
        <button
          type="button"
          onClick={loadTicker}
          className="text-[#38D9F5] hover:underline inline-flex items-center space-x-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#0A1024]/95 border-b border-[rgba(125,160,255,0.18)] py-2 px-4 overflow-hidden text-xs">
      <div className="animate-ticker space-x-5 items-center">
        {[...items, ...items].map((item, idx) => {
          const isPos = item.isPositive;
          return (
            <div
              key={`${item.name}-${idx}`}
              className="inline-flex items-center space-x-2.5 bg-[#10182B] px-3 py-1 rounded-lg border border-[rgba(125,160,255,0.16)] hover:border-[#38D9F5]/40 transition-colors cursor-default"
            >
              <span className="font-bold text-[#F8FAFF] font-mono text-[11px]">{item.name}</span>
              <span className="font-mono text-[#AAB7D0] tabular-nums text-[11px]">{item.value}</span>
              <span
                className={`font-mono font-bold text-[11px] tabular-nums inline-flex items-center ${
                  isPos ? 'text-[#31E981]' : 'text-[#FF586A]'
                }`}
              >
                {isPos ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {item.changePercent}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
