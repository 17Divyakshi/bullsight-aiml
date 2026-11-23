import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { stockAPI } from '../services/api';
import { UnavailableState } from './UnavailableState';
import { formatAssetPrice, formatSignedPercent } from '../utils/formatters';
import { LayoutGrid, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';

export const LiveMarketHeatmap = ({ onSelectSymbol }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [marketFilter, setMarketFilter] = useState('ALL');

  const loadHeatmap = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockAPI.getScreener();
      const rows = Array.isArray(res?.items) ? res.items : [];
      setItems(rows);
      setAvailable(Boolean(res?.available && rows.length > 0));
    } catch {
      setItems([]);
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

  const filtered = items.filter(item => {
    const sym = String(item.symbol || '');
    const isIndian = sym === '^NSEI' || sym.endsWith('.NS') || item.market === 'INDIAN';
    const isCrypto = sym.includes('BTC') || sym.includes('ETH') || item.market === 'CRYPTO';
    if (marketFilter === 'NSE') return isIndian;
    if (marketFilter === 'US') return !isIndian && !isCrypto;
    if (marketFilter === 'CRYPTO') return isCrypto;
    return true;
  });

  const handleTileClick = sym => {
    if (onSelectSymbol) {
      onSelectSymbol(sym);
    } else {
      navigate(`/dashboard?symbol=${encodeURIComponent(sym)}`);
    }
  };

  return (
    <div className="bull-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <LayoutGrid className="w-4 h-4 text-[#38D9F5]" />
            <h3 className="text-sm sm:text-base font-bold font-display text-[#F8FAFF]">
              Live Market Heatmap
            </h3>
          </div>
          <p className="text-xs text-[#AAB7D0]">
            Color-coded session performance map across observed equities. Click any tile to inspect charts and indicators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-[#070B1A] p-1 rounded-xl border border-[rgba(125,160,255,0.18)] text-[11px] font-mono">
            {['ALL', 'NSE', 'US', 'CRYPTO'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMarketFilter(m)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  marketFilter === m
                    ? 'bg-[#31E981] text-[#070B1A]'
                    : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadHeatmap}
            disabled={loading}
            className="p-2 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.2)] text-[#38D9F5] hover:border-[#31E981]/45 transition-all"
            title="Refresh Heatmap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-[#10182B] animate-pulse" />
          ))}
        </div>
      ) : !available || items.length === 0 ? (
        <UnavailableState
          compact
          title="Live market data or AI prediction is currently unavailable."
          description="Unable to render the market heatmap without observed asset quotes."
          onRetry={loadHeatmap}
          retrying={loading}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map(item => {
            const pct = item.changePercent != null ? Number(item.changePercent) : null;
            const hasPrice = item.price != null;
            const isPos = pct != null ? pct >= 0 : true;
            const mag = pct != null ? Math.min(1, Math.abs(pct) / 4.5) : 0;

            const tileStyle =
              pct == null
                ? 'bg-[#10182B] border-[rgba(125,160,255,0.18)]'
                : isPos
                  ? mag > 0.45
                    ? 'bg-[#31E981]/22 border-[#31E981]/45'
                    : 'bg-[#31E981]/12 border-[#31E981]/30'
                  : mag > 0.45
                    ? 'bg-[#FF586A]/22 border-[#FF586A]/45'
                    : 'bg-[#FF586A]/12 border-[#FF586A]/30';

            return (
              <button
                type="button"
                key={item.symbol}
                onClick={() => handleTileClick(item.symbol)}
                className={`p-3.5 rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-cardHover flex flex-col justify-between space-y-2 ${tileStyle}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-extrabold font-mono text-[#F8FAFF] truncate">
                    {item.symbol}
                  </span>
                  {pct != null && (
                    isPos ? (
                      <TrendingUp className="w-3.5 h-3.5 text-[#31E981] shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-[#FF586A] shrink-0" />
                    )
                  )}
                </div>

                <div>
                  <div className="text-sm font-extrabold font-mono text-[#F8FAFF] tabular-nums">
                    {hasPrice ? formatAssetPrice(item.price, item.symbol) : 'Unavailable'}
                  </div>
                  <div
                    className={`text-xs font-mono font-bold tabular-nums mt-0.5 ${
                      pct == null
                        ? 'text-[#7B8AA8]'
                        : isPos
                          ? 'text-[#31E981]'
                          : 'text-[#FF586A]'
                    }`}
                  >
                    {pct != null ? formatSignedPercent(pct) : 'N/A'}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-[#AAB7D0] pt-1 border-t border-[rgba(125,160,255,0.12)]">
                  <span>RSI {item.rsi != null ? Number(item.rsi).toFixed(0) : '—'}</span>
                  <span className="truncate max-w-[75px]">{item.sector || 'Equity'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
