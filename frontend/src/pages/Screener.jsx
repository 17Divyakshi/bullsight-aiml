import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { UnavailableState } from '../components/UnavailableState';
import { LiveMarketHeatmap } from '../components/LiveMarketHeatmap';
import { Footer } from '../components/Footer';
import { stockAPI } from '../services/api';
import { formatAssetPrice, formatSignedPercent } from '../utils/formatters';
import { Sliders, Search, ArrowUpDown, ExternalLink, RefreshCw, LayoutGrid, Table2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Screener = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [available, setAvailable] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [signalFilter, setSignalFilter] = useState('ALL');
  const [sortField, setSortField] = useState('symbol');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState('table');

  const loadScreener = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockAPI.getScreener();
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setStocks(items);
      setAvailable(Boolean(res?.available ?? items.length > 0));
      setErrorMsg(res?.message || '');
    } catch (err) {
      console.error('Screener fetch error:', err);
      setStocks([]);
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScreener();
  }, [loadScreener]);

  const handleSort = field => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredStocks = stocks
    .filter(stock => {
      const sym = String(stock.symbol || '');
      const name = String(stock.name || '');
      const sector = String(stock.sector || '');

      const matchesSearch =
        sym.toLowerCase().includes(search.toLowerCase()) ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        sector.toLowerCase().includes(search.toLowerCase());

      const isIndian = sym === '^NSEI' || sym.endsWith('.NS') || stock.market === 'INDIAN';
      const isCrypto = sym.includes('BTC') || sym.includes('ETH') || stock.market === 'CRYPTO';

      const matchesMarket =
        marketFilter === 'ALL' ||
        (marketFilter === 'INDIAN' && isIndian) ||
        (marketFilter === 'CRYPTO' && isCrypto) ||
        (marketFilter === 'US' && !isIndian && !isCrypto);

      const matchesSector =
        sectorFilter === 'ALL' ||
        sector.toLowerCase().includes(sectorFilter.toLowerCase());

      const sig = String(stock.signal || 'UNVERIFIED').toUpperCase();
      const matchesSignal = signalFilter === 'ALL' || sig === signalFilter;

      return matchesSearch && matchesMarket && matchesSector && matchesSignal;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(String(bVal)) : String(bVal).localeCompare(aVal);
      }
      return sortAsc ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Market Screener" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#31E981]" />
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Quantitative Market Screener
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0] mt-1">
                Filter observed NSE and global equities by RSI momentum, MACD direction, and verified next-session AI signals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <div className="flex bg-[#10182B] p-1 rounded-xl border border-[rgba(125,160,255,0.2)] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    viewMode === 'table'
                      ? 'bg-[#31E981] text-[#070B1A]'
                      : 'text-[#AAB7D0] hover:text-[#F8FAFF]'
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('heatmap')}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    viewMode === 'heatmap'
                      ? 'bg-[#38D9F5] text-[#070B1A]'
                      : 'text-[#AAB7D0] hover:text-[#F8FAFF]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Heatmap View</span>
                </button>
              </div>

              <button
                type="button"
                onClick={loadScreener}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] text-[#38D9F5] hover:border-[#31E981]/45 text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Scanning...' : 'Refresh Screener'}</span>
              </button>
            </div>
          </div>

          {viewMode === 'heatmap' ? (
            <LiveMarketHeatmap
              onSelectSymbol={sym => navigate(`/dashboard?symbol=${encodeURIComponent(sym)}`)}
            />
          ) : (
            <>
              {/* Filter Controls Bar */}
              <div className="bull-card p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-[#7B8AA8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticker or company name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#070B1A] border border-[rgba(125,160,255,0.2)] rounded-xl pl-10 pr-3.5 py-2 text-xs font-mono text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Market Filter */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-[#7B8AA8]">Market:</span>
                <div className="flex bg-[#070B1A] p-1 rounded-xl border border-[rgba(125,160,255,0.18)]">
                  {[
                    { id: 'ALL', label: 'ALL' },
                    { id: 'INDIAN', label: 'NSE' },
                    { id: 'US', label: 'US' },
                    { id: 'CRYPTO', label: 'CRYPTO/ETF' },
                  ].map(m => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMarketFilter(m.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                        marketFilter === m.id
                          ? 'bg-[#31E981] text-[#070B1A]'
                          : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sector Dropdown */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-[#7B8AA8]">Sector:</span>
                <select
                  value={sectorFilter}
                  onChange={e => setSectorFilter(e.target.value)}
                  className="bg-[#070B1A] border border-[rgba(125,160,255,0.18)] rounded-xl px-2.5 py-1.5 text-xs font-mono font-medium text-[#F8FAFF] focus:outline-none focus:border-[#38D9F5]"
                >
                  <option value="ALL">All Sectors</option>
                  <option value="Benchmark">Benchmark Index</option>
                  <option value="Technology">Technology &amp; IT</option>
                  <option value="Semiconductors">Semiconductors</option>
                  <option value="Banking">Banking &amp; Finance</option>
                  <option value="Energy">Energy &amp; Retail</option>
                  <option value="Automotive">Automotive</option>
                  <option value="Index ETF">Index ETFs</option>
                  <option value="Cryptocurrency">Cryptocurrency</option>
                </select>
              </div>

              {/* Signal Filter */}
              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-[#7B8AA8]">Signal:</span>
                <div className="flex bg-[#070B1A] p-1 rounded-xl border border-[rgba(125,160,255,0.18)]">
                  {['ALL', 'BUY', 'HOLD', 'SELL'].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSignalFilter(s)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                        signalFilter === s
                          ? 'bg-[#4D8DFF] text-[#F8FAFF]'
                          : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Table or Honest Unavailable State */}
          {loading ? (
            <div className="bull-card p-5 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-11 rounded-xl bg-[#10182B] animate-pulse" />
              ))}
            </div>
          ) : !available || stocks.length === 0 ? (
            <UnavailableState
              title="Live market data or AI prediction is currently unavailable."
              description={errorMsg || 'Screener quotes could not be retrieved from the market backend.'}
              onRetry={loadScreener}
              retrying={loading}
            />
          ) : (
            <div className="bull-card p-5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[rgba(125,160,255,0.16)] text-[#7B8AA8] uppercase text-[10px]">
                      <th className="py-3 px-3 cursor-pointer hover:text-[#F8FAFF]" onClick={() => handleSort('symbol')}>
                        <div className="flex items-center space-x-1">
                          <span>Equity</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3">Sector</th>
                      <th className="py-3 px-3 cursor-pointer hover:text-[#F8FAFF]" onClick={() => handleSort('price')}>
                        <div className="flex items-center space-x-1">
                          <span>Observed Close</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3 cursor-pointer hover:text-[#F8FAFF]" onClick={() => handleSort('changePercent')}>
                        <div className="flex items-center space-x-1">
                          <span>Session Change</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3 cursor-pointer hover:text-[#F8FAFF]" onClick={() => handleSort('rsi')}>
                        <div className="flex items-center space-x-1">
                          <span>RSI (14)</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3">MACD Trend</th>
                      <th className="py-3 px-3">Next-Session Signal</th>
                      <th className="py-3 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(125,160,255,0.1)]">
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#7B8AA8]">
                          No assets match your active filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.map(stock => {
                        const hasPrice = stock.price != null;
                        const hasPct = stock.changePercent != null;
                        const isPos = (stock.changePercent || 0) >= 0;
                        const sig = String(stock.signal || 'N/A').toUpperCase();
                        const hasVerifiedSignal = sig === 'BUY' || sig === 'SELL' || sig === 'HOLD';
                        return (
                          <tr
                            key={stock.symbol}
                            className="hover:bg-[#151F36]/70 transition-colors group cursor-pointer"
                            onClick={() => navigate(`/dashboard?symbol=${encodeURIComponent(stock.symbol)}`)}
                          >
                            <td className="py-3.5 px-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm text-[#F8FAFF] group-hover:text-[#31E981] transition-colors">
                                  {stock.symbol}
                                </span>
                                <span className="text-[11px] text-[#7B8AA8] font-sans truncate max-w-[150px]">
                                  {stock.name}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="text-[10px] text-[#AAB7D0] px-2 py-0.5 rounded-md bg-[#070B1A] border border-[rgba(125,160,255,0.16)] whitespace-nowrap">
                                {stock.sector || 'Equity'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-bold text-sm text-[#F8FAFF] tabular-nums">
                              {hasPrice ? formatAssetPrice(stock.price, stock.symbol) : 'Unavailable'}
                            </td>

                            <td className="py-3.5 px-3">
                              {hasPct ? (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums border ${
                                    isPos
                                      ? 'bg-[#31E981]/10 text-[#31E981] border-[#31E981]/25'
                                      : 'bg-[#FF586A]/10 text-[#FF586A] border-[#FF586A]/25'
                                  }`}
                                >
                                  {formatSignedPercent(stock.changePercent)}
                                </span>
                              ) : (
                                <span className="text-[#7B8AA8]">N/A</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 font-bold text-[#F8FAFF] tabular-nums">
                              {stock.rsi != null ? Number(stock.rsi).toFixed(1) : 'N/A'}
                            </td>

                            <td className="py-3.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  stock.macdSignal === 'Bullish'
                                    ? 'text-[#31E981] bg-[#31E981]/10'
                                    : stock.macdSignal === 'Bearish'
                                      ? 'text-[#FF586A] bg-[#FF586A]/10'
                                      : 'text-[#7B8AA8] bg-[#070B1A]'
                                }`}
                              >
                                {stock.macdSignal || 'N/A'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md font-display font-bold text-[10px] ${
                                    sig === 'BUY'
                                      ? 'bg-[#31E981]/12 text-[#31E981] border border-[#31E981]/30'
                                      : sig === 'SELL'
                                        ? 'bg-[#FF586A]/12 text-[#FF586A] border border-[#FF586A]/30'
                                        : hasVerifiedSignal
                                          ? 'bg-[#4D8DFF]/12 text-[#4D8DFF] border border-[#4D8DFF]/30'
                                          : 'bg-[#070B1A] text-[#7B8AA8] border border-[rgba(125,160,255,0.16)]'
                                  }`}
                                >
                                  {sig}
                                </span>
                                {stock.aiPredictionPct != null && (
                                  <span className="text-[#38D9F5] text-[10px] tabular-nums font-bold">
                                    {formatSignedPercent(stock.aiPredictionPct)}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              <Link
                                to={`/dashboard?symbol=${encodeURIComponent(stock.symbol)}`}
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center space-x-1 p-1.5 rounded-lg border border-[rgba(125,160,255,0.2)] text-[#AAB7D0] hover:text-[#31E981] hover:border-[#31E981]/40 transition-all"
                                title="Open in Dashboard"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
};
