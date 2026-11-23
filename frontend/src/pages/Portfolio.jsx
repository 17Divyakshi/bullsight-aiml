import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Footer } from '../components/Footer';
import { stockAPI } from '../services/api';
import { formatAssetPrice } from '../utils/formatters';
import { Briefcase, Plus, TrendingUp, TrendingDown, Trash2, PieChart as PieIcon, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';
import { STOCKS } from '../data/stocks';

const INITIAL_HOLDINGS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', qty: 50, buyPrice: 2850.0 },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', qty: 20, buyPrice: 3980.0 },
  { symbol: 'INFY.NS', name: 'Infosys Limited', qty: 35, buyPrice: 1580.0 },
];

export const Portfolio = () => {
  const [holdings, setHoldings] = useState(() => {
    try {
      const saved = localStorage.getItem('bullsight_portfolio');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_HOLDINGS;
    } catch {
      return INITIAL_HOLDINGS;
    }
  });

  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);

  const [symbolInput, setSymbolInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function initPortfolio() {
      try {
        const remote = await stockAPI.getPortfolio();
        if (Array.isArray(remote) && remote.length > 0) {
          setHoldings(remote);
        }
      } catch {
        // use localStorage positions
      }
    }
    initPortfolio();
  }, []);

  const loadPrices = useCallback(async (items = holdings) => {
    setLoading(true);
    const prices = {};
    await Promise.all(
      items.map(async h => {
        try {
          const sum = await stockAPI.getSummary(h.symbol);
          prices[h.symbol] = sum?.isLive && sum?.price != null ? Number(sum.price) : null;
        } catch {
          prices[h.symbol] = null;
        }
      })
    );
    setLivePrices(prices);
    setLoading(false);
  }, [holdings]);

  useEffect(() => {
    try {
      localStorage.setItem('bullsight_portfolio', JSON.stringify(holdings));
    } catch {
      // ignore storage errors
    }
    loadPrices(holdings);
  }, [holdings, loadPrices]);

  const handleAddHolding = async e => {
    e.preventDefault();
    if (!symbolInput || !qtyInput || !priceInput) return;

    const sym = symbolInput.toUpperCase().trim();
    const qtyNum = parseFloat(qtyInput);
    const priceNum = parseFloat(priceInput);
    if (!Number.isFinite(qtyNum) || !Number.isFinite(priceNum) || qtyNum <= 0 || priceNum <= 0) {
      return;
    }

    const newH = {
      symbol: sym,
      name: `${sym} Position`,
      qty: qtyNum,
      quantity: qtyNum,
      buyPrice: priceNum,
      buy_price: priceNum,
    };

    setHoldings([...holdings, newH]);
    setSymbolInput('');
    setQtyInput('');
    setPriceInput('');
    setIsModalOpen(false);

    try {
      await stockAPI.addHolding({
        symbol: sym,
        name: `${sym} Position`,
        quantity: qtyNum,
        buyPrice: priceNum,
      });
    } catch (err) {
      console.warn('Portfolio sync error:', err);
    }
  };

  const handleRemove = async (idx, holding) => {
    setHoldings(holdings.filter((_, i) => i !== idx));
    try {
      const identifier = holding?.id || holding?._id || holding?.symbol;
      if (identifier) {
        await stockAPI.deleteHolding(identifier);
      }
    } catch (err) {
      console.warn('Portfolio remove sync error:', err);
    }
  };

  const investedAmount = holdings.reduce((acc, h) => {
    const qty = Number(h.qty || h.quantity || 0);
    const buyPrice = Number(h.buyPrice || h.buy_price || 0);
    return acc + qty * buyPrice;
  }, 0);

  const pricedHoldings = holdings.filter(h => livePrices[h.symbol] != null);
  const allPriced = holdings.length > 0 && pricedHoldings.length === holdings.length;
  const anyPriced = pricedHoldings.length > 0;

  const currentValue = pricedHoldings.reduce((acc, h) => {
    const qty = Number(h.qty || h.quantity || 0);
    const cur = Number(livePrices[h.symbol]);
    return acc + qty * cur;
  }, 0);

  const pricedCostBasis = pricedHoldings.reduce((acc, h) => {
    const qty = Number(h.qty || h.quantity || 0);
    const buyPrice = Number(h.buyPrice || h.buy_price || 0);
    return acc + qty * buyPrice;
  }, 0);

  const profitLoss = anyPriced ? currentValue - pricedCostBasis : null;
  const returnPct = anyPriced && pricedCostBasis > 0 ? (profitLoss / pricedCostBasis) * 100 : null;
  const isPos = (profitLoss ?? 0) >= 0;

  // Allocation uses cost basis when live price is unavailable
  const pieData = holdings.map(h => {
    const qty = Number(h.qty || h.quantity || 0);
    const basisPrice = livePrices[h.symbol] != null ? Number(livePrices[h.symbol]) : Number(h.buyPrice || h.buy_price || 0);
    return {
      name: h.symbol,
      value: Math.max(1, Math.round(qty * basisPrice)),
    };
  });
  const totalAllocationWeight = pieData.reduce((acc, d) => acc + d.value, 0);

  const COLORS = ['#31E981', '#38D9F5', '#4D8DFF', '#9065FF', '#FF586A'];

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Portfolio" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-[#31E981]" />
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Portfolio Valuation &amp; Allocation
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0] mt-1">
                Track equity positions, observed mark-to-market valuations, and capital allocation across holdings.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => loadPrices(holdings)}
                disabled={loading}
                className="px-3.5 py-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] text-[#38D9F5] text-xs font-bold flex items-center space-x-1.5 hover:border-[#31E981]/45 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Quotes</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] hover:shadow-bullGlow text-[#070B1A] text-xs font-extrabold transition-all flex items-center space-x-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Position</span>
              </button>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bull-card bull-card-interactive p-5 space-y-1.5">
              <span className="text-[10px] font-mono text-[#7B8AA8] uppercase tracking-wider">Total Cost Basis</span>
              <div className="text-2xl font-extrabold font-mono text-[#F8FAFF] tabular-nums">
                {investedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-[#7B8AA8]">{holdings.length} Recorded Positions</p>
            </div>

            <div className="bull-card bull-card-interactive p-5 space-y-1.5">
              <span className="text-[10px] font-mono text-[#7B8AA8] uppercase tracking-wider">Observed Valuation</span>
              <div className="text-2xl font-extrabold font-mono text-[#38D9F5] tabular-nums">
                {anyPriced
                  ? currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : 'Unavailable'}
              </div>
              <p className="text-[11px] text-[#7B8AA8]">
                {loading
                  ? 'Fetching market prices...'
                  : allPriced
                    ? 'Marked to observed close'
                    : anyPriced
                      ? `${pricedHoldings.length}/${holdings.length} live quotes`
                      : 'Market quotes unavailable'}
              </p>
            </div>

            <div className="bull-card bull-card-interactive p-5 space-y-1.5">
              <span className="text-[10px] font-mono text-[#7B8AA8] uppercase tracking-wider">Unrealized PnL</span>
              <div className={`text-2xl font-extrabold font-mono tabular-nums flex items-center ${profitLoss == null ? 'text-[#7B8AA8]' : isPos ? 'text-[#31E981]' : 'text-[#FF586A]'}`}>
                {profitLoss != null ? (
                  <>
                    {isPos ? <TrendingUp className="w-5 h-5 mr-1.5" /> : <TrendingDown className="w-5 h-5 mr-1.5" />}
                    {isPos ? '+' : '-'}{Math.abs(profitLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </>
                ) : (
                  'Unavailable'
                )}
              </div>
              <p className="text-[11px] text-[#7B8AA8]">Computed only for priced positions</p>
            </div>

            <div className="bull-card bull-card-interactive p-5 space-y-1.5">
              <span className="text-[10px] font-mono text-[#7B8AA8] uppercase tracking-wider">Net Return ROI (%)</span>
              <div className={`text-2xl font-extrabold font-mono tabular-nums ${returnPct == null ? 'text-[#7B8AA8]' : isPos ? 'text-[#31E981]' : 'text-[#FF586A]'}`}>
                {returnPct != null ? `${isPos ? '+' : ''}${returnPct.toFixed(2)}%` : 'Unavailable'}
              </div>
              <p className="text-[11px] text-[#7B8AA8]">Observed portfolio return</p>
            </div>
          </div>

          {/* Allocation & Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Holdings Table */}
            <div className="lg:col-span-2 bull-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,255,0.16)]">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-[#F8FAFF]">
                  Open Positions
                </span>
                <span className="text-[10px] font-mono text-[#7B8AA8]">{holdings.length} Equities</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[rgba(125,160,255,0.16)] text-[#7B8AA8] uppercase text-[10px]">
                      <th className="py-2.5 px-3">Ticker</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Avg Cost</th>
                      <th className="py-2.5 px-3">Observed Price</th>
                      <th className="py-2.5 px-3">Valuation</th>
                      <th className="py-2.5 px-3">PnL</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(125,160,255,0.1)]">
                    {holdings.map((h, idx) => {
                      const qty = Number(h.qty || h.quantity || 0);
                      const buyPrice = Number(h.buyPrice || h.buy_price || 0);
                      const cur = livePrices[h.symbol];
                      const hasCur = cur != null;
                      const val = hasCur ? qty * cur : null;
                      const pnl = hasCur ? (cur - buyPrice) * qty : null;
                      const pos = (pnl ?? 0) >= 0;

                      return (
                        <tr key={idx} className="hover:bg-[#151F36]/55 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#F8FAFF]">{h.symbol}</td>
                          <td className="py-3 px-3 text-[#AAB7D0] tabular-nums">{qty}</td>
                          <td className="py-3 px-3 text-[#7B8AA8] tabular-nums">
                            {formatAssetPrice(buyPrice, h.symbol)}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#F8FAFF] tabular-nums">
                            {hasCur ? formatAssetPrice(cur, h.symbol) : 'Unavailable'}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#38D9F5] tabular-nums">
                            {val != null ? formatAssetPrice(val, h.symbol) : 'Unavailable'}
                          </td>
                          <td className={`py-3 px-3 font-bold tabular-nums ${pnl == null ? 'text-[#7B8AA8]' : pos ? 'text-[#31E981]' : 'text-[#FF586A]'}`}>
                            {pnl != null ? `${pos ? '+' : '-'}${formatAssetPrice(Math.abs(pnl), h.symbol)}` : 'N/A'}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemove(idx, h)}
                              className="p-1 rounded text-[#7B8AA8] hover:text-[#FF586A] transition-colors"
                              title="Delete Holding"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Asset Allocation Donut Chart */}
            <div className="bull-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,255,0.16)]">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-[#F8FAFF]">
                  Allocation Breakdown
                </span>
                <PieIcon className="w-4 h-4 text-[#38D9F5]" />
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
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
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-[rgba(125,160,255,0.16)]">
                {pieData.map((item, i) => {
                  const pct = totalAllocationWeight > 0 ? ((item.value / totalAllocationWeight) * 100).toFixed(1) : '0.0';
                  return (
                    <div key={item.name + i} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="font-bold text-[#F8FAFF]">{item.name}</span>
                      </div>
                      <span className="text-[#AAB7D0] tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add Holding Modal Dialog */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070B1A]/75 backdrop-blur-sm p-4">
              <div className="bull-card p-6 max-w-md w-full bg-[#10182B] shadow-cardHover space-y-4 border border-[rgba(125,160,255,0.28)]">
                <div className="flex justify-between items-center pb-3 border-b border-[rgba(125,160,255,0.16)]">
                  <h3 className="text-sm font-bold font-display text-[#F8FAFF] uppercase tracking-wider">
                    Add Portfolio Position
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="text-[#AAB7D0] hover:text-[#F8FAFF] text-xs font-mono"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddHolding} className="space-y-3.5 text-xs font-mono">
                  <div>
                    <label className="text-[#AAB7D0] block mb-1">Stock Ticker Symbol</label>
                    <input
                      type="text"
                      list="stocks-datalist"
                      placeholder="e.g. RELIANCE.NS, TCS.NS, INFY.NS..."
                      value={symbolInput}
                      onChange={e => setSymbolInput(e.target.value)}
                      className="w-full bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-xl px-3 py-2 text-[#F8FAFF] focus:outline-none focus:border-[#38D9F5]"
                      required
                    />
                    <datalist id="stocks-datalist">
                      {STOCKS.map(s => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.name} ({s.exchange})
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="text-[#AAB7D0] block mb-1">Quantity (Shares)</label>
                    <input
                      type="number"
                      step="any"
                      min="0.0001"
                      placeholder="e.g. 25"
                      value={qtyInput}
                      onChange={e => setQtyInput(e.target.value)}
                      className="w-full bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-xl px-3 py-2 text-[#F8FAFF] focus:outline-none focus:border-[#38D9F5]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[#AAB7D0] block mb-1">Average Purchase Price</label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="e.g. 2850.00"
                      value={priceInput}
                      onChange={e => setPriceInput(e.target.value)}
                      className="w-full bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-xl px-3 py-2 text-[#F8FAFF] focus:outline-none focus:border-[#38D9F5]"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[rgba(125,160,255,0.22)] text-[#AAB7D0] hover:text-[#F8FAFF] transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A] font-extrabold transition-all"
                    >
                      Save Position
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
};
