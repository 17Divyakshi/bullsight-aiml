import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Footer } from '../components/Footer';
import { stockAPI } from '../services/api';
import { SUPPORTED_FIVE_STOCKS } from '../data/stocks';
import { formatAssetPrice, formatSignedPercent } from '../utils/formatters';
import { Bookmark, Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const INITIAL_WATCHLIST = SUPPORTED_FIVE_STOCKS.map(s => s.symbol);

export const Watchlist = () => {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(() => {
    try {
      const saved = localStorage.getItem('bullsight_watchlist');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_WATCHLIST;
    } catch {
      return INITIAL_WATCHLIST;
    }
  });

  const [stockDetails, setStockDetails] = useState({});
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initWatchlist() {
      try {
        const remote = await stockAPI.getWatchlist();
        if (Array.isArray(remote) && remote.length > 0) {
          setWatchlist(remote);
        }
      } catch {
        // retain local list
      }
    }
    initWatchlist();
  }, []);

  const loadWatchlistData = useCallback(async (symbols = watchlist) => {
    if (!symbols || symbols.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const details = {};
    await Promise.all(
      symbols.map(async sym => {
        try {
          const [sum, pred] = await Promise.all([
            stockAPI.getSummary(sym),
            stockAPI.getPrediction(sym, { buyThreshold: 1.0, sellThreshold: -1.0 }),
          ]);
          details[sym] = { summary: sum, prediction: pred };
        } catch (e) {
          console.error(`Error loading watchlist item ${sym}:`, e);
        }
      })
    );
    setStockDetails(details);
    setLoading(false);
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem('bullsight_watchlist', JSON.stringify(watchlist));
    } catch {
      // ignore storage errors
    }
    loadWatchlistData(watchlist);
  }, [watchlist, loadWatchlistData]);

  const handleAdd = async e => {
    e?.preventDefault();
    const clean = input.trim().toUpperCase();
    if (clean && !watchlist.includes(clean)) {
      setWatchlist([...watchlist, clean]);
      setInput('');
      try {
        await stockAPI.addToWatchlist(clean);
      } catch (err) {
        console.warn('Watchlist sync error:', err);
      }
    }
  };

  const handleRemove = async (sym, e) => {
    e.stopPropagation();
    setWatchlist(watchlist.filter(s => s !== sym));
    try {
      await stockAPI.deleteFromWatchlist(sym);
    } catch (err) {
      console.warn('Watchlist remove sync error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Watchlist" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Bookmark className="w-5 h-5 text-[#31E981]" />
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Tracked Equities Watchlist
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0] mt-1">
                Monitor core NIFTY 50 &amp; NSE leaders with observed closes, volume metrics, and verified next-session AI signals.
              </p>
            </div>

            <form onSubmit={handleAdd} className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add ticker (e.g. ^NSEI, INFY.NS)..."
                value={input}
                onChange={e => setInput(e.target.value)}
                className="bg-[#10182B] border border-[rgba(125,160,255,0.22)] rounded-xl px-3.5 py-2 text-xs font-mono text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5]"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] hover:shadow-bullGlow text-[#070B1A] text-xs font-extrabold transition-all disabled:opacity-50 flex items-center space-x-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ticker</span>
              </button>
              <button
                type="button"
                onClick={() => loadWatchlistData(watchlist)}
                className="p-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] text-[#38D9F5] hover:border-[#31E981]/45 transition-all"
                title="Refresh Quotes"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </form>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-[#7B8AA8]">Quick Add:</span>
            <div className="flex flex-wrap gap-1.5">
              {['^NSEI', 'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'AAPL', 'NVDA', 'SPY']
                .filter(s => !watchlist.includes(s))
                .map(s => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setWatchlist([...watchlist, s])}
                    className="px-2.5 py-1 rounded-lg bg-[#10182B] border border-[rgba(125,160,255,0.18)] text-[#AAB7D0] hover:text-[#31E981] hover:border-[#31E981]/40 text-[11px] font-semibold transition-colors whitespace-nowrap"
                  >
                    +{s}
                  </button>
                ))}
            </div>
          </div>

          {/* Watchlist Table */}
          <div className="bull-card p-5 overflow-hidden">
            {loading && watchlist.length > 0 ? (
              <div className="p-8 text-center text-xs font-mono text-[#7B8AA8] space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#31E981] mx-auto" />
                <span>Fetching observed market quotes and ML signals...</span>
              </div>
            ) : watchlist.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Bookmark className="w-8 h-8 text-[#7B8AA8] mx-auto" />
                <h3 className="text-sm font-bold text-[#F8FAFF]">Your Watchlist is Empty</h3>
                <p className="text-xs text-[#AAB7D0] max-w-sm mx-auto">
                  Add NSE India or US tickers above to monitor observed closing prices and AI signals.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[rgba(125,160,255,0.16)] text-[#7B8AA8] uppercase text-[10px]">
                      <th className="py-3 px-3">Symbol / Asset</th>
                      <th className="py-3 px-3">Observed Price</th>
                      <th className="py-3 px-3">Session Change</th>
                      <th className="py-3 px-3">Next-Session Forecast</th>
                      <th className="py-3 px-3">Volume</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(125,160,255,0.1)]">
                    {watchlist.map(sym => {
                      const data = stockDetails[sym];
                      const sum = data?.summary;
                      const pred = data?.prediction;
                      const isLive = Boolean(sum?.isLive && sum?.price != null);
                      const isPos = (sum?.change || 0) >= 0;
                      const mlVerified = Boolean(pred?.ml_verified && pred?.predicted_next_close != null);
                      const sig = mlVerified ? String(pred?.signal || 'HOLD').toUpperCase() : 'UNAVAILABLE';

                      return (
                        <tr
                          key={sym}
                          className="hover:bg-[#151F36]/70 transition-colors group cursor-pointer"
                          onClick={() => navigate(`/dashboard?symbol=${encodeURIComponent(sym)}`)}
                        >
                          <td className="py-3.5 px-3">
                            <div className="flex items-center space-x-2.5">
                              <span className="font-bold text-sm text-[#F8FAFF] group-hover:text-[#31E981] transition-colors">
                                {sym}
                              </span>
                              <span className="text-[11px] text-[#7B8AA8] truncate max-w-[140px] sm:max-w-xs font-sans">
                                {sum?.name || sym}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-bold text-sm text-[#F8FAFF] tabular-nums">
                            {isLive ? formatAssetPrice(sum.price, sym) : 'Unavailable'}
                          </td>

                          <td className="py-3.5 px-3">
                            {isLive && sum?.changePercent != null ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold tabular-nums whitespace-nowrap ${
                                  isPos
                                    ? 'bg-[#31E981]/10 text-[#31E981] border-[#31E981]/25'
                                    : 'bg-[#FF586A]/10 text-[#FF586A] border-[#FF586A]/25'
                                }`}
                              >
                                {isPos ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                                {formatSignedPercent(sum.changePercent)}
                              </span>
                            ) : (
                              <span className="text-[#7B8AA8]">Unavailable</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            {mlVerified ? (
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-display font-bold text-[10px] border ${
                                    sig === 'BUY'
                                      ? 'bg-[#31E981]/10 text-[#31E981] border-[#31E981]/25'
                                      : sig === 'SELL'
                                        ? 'bg-[#FF586A]/10 text-[#FF586A] border-[#FF586A]/25'
                                        : 'bg-[#4D8DFF]/10 text-[#4D8DFF] border-[#4D8DFF]/25'
                                  }`}
                                >
                                  {sig}
                                </span>
                                <span className="text-[#38D9F5] text-[10px] tabular-nums font-bold">
                                  {formatAssetPrice(pred.predicted_next_close, sym)} ({formatSignedPercent(pred.predicted_change_percent)})
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#7B8AA8]">Unavailable</span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 text-[#AAB7D0] tabular-nums">
                            {sum?.volume || 'N/A'}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center space-x-2">
                              <Link
                                to={`/dashboard?symbol=${encodeURIComponent(sym)}`}
                                onClick={e => e.stopPropagation()}
                                className="p-1.5 rounded-lg border border-[rgba(125,160,255,0.2)] text-[#AAB7D0] hover:text-[#31E981] hover:border-[#31E981]/40 transition-all"
                                title="Open in Dashboard"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                type="button"
                                onClick={e => handleRemove(sym, e)}
                                className="p-1.5 rounded-lg border border-[rgba(125,160,255,0.2)] text-[#AAB7D0] hover:text-[#FF586A] hover:border-[#FF586A]/40 transition-all"
                                title="Remove from Watchlist"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
};
