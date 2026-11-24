import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { ChartContainer } from '../components/ChartContainer';
import { UnavailableState } from '../components/UnavailableState';
import { Footer } from '../components/Footer';
import { stockAPI } from '../services/api';
import { SUPPORTED_FIVE_STOCKS } from '../data/stocks';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  LineChart as LineChartIcon,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Info,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

function pickField(row, keys) {
  for (const k of keys) {
    if (row && row[k] !== undefined && row[k] !== null && row[k] !== '') {
      return row[k];
    }
  }
  return null;
}

export const Backtesting = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSymbol = searchParams.get('symbol') || SUPPORTED_FIVE_STOCKS[0].symbol;
  const [symbol, setSymbol] = useState(
    SUPPORTED_FIVE_STOCKS.some(s => s.symbol === initialSymbol)
      ? initialSymbol
      : SUPPORTED_FIVE_STOCKS[0].symbol
  );
  const [btData, setBtData] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSelectSymbol = newSym => {
    setSymbol(newSym);
    setSearchParams({ symbol: newSym });
  };

  const loadBacktesting = useCallback(async (sym = symbol) => {
    setLoading(true);
    try {
      const res = await stockAPI.getBacktesting(sym);
      setBtData(res);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadBacktesting(symbol);
  }, [symbol, loadBacktesting]);

  const rows = btData?.rows || [];
  const summary = btData?.summary || {};
  const available = Boolean(btData?.available && rows.length > 0);

  const curvePoints = useMemo(() => {
    if (!rows.length) return [];
    const sample = rows[0];
    const hasCurveCols =
      pickField(sample, ['target_date', 'date', 'Date', 'trading_date']) !== null &&
      (pickField(sample, ['strategy_equity', 'Strategy_Equity', 'cumulative_strategy_return', 'strategy_return_cum']) !== null ||
        pickField(sample, ['buy_hold_equity', 'Buy_Hold_Equity', 'benchmark_equity']) !== null);

    if (!hasCurveCols) return [];
    return rows.map((r, idx) => ({
      date: pickField(r, ['target_date', 'date', 'Date', 'trading_date']) || `Session ${idx + 1}`,
      strategy: Number(
        pickField(r, ['strategy_equity', 'Strategy_Equity', 'cumulative_strategy_return', 'strategy_return_cum', 'strategy_cumulative_pct']) ?? 0
      ),
      buyHold: Number(
        pickField(r, ['buy_hold_equity', 'Buy_Hold_Equity', 'benchmark_equity', 'cumulative_buy_hold_return', 'buy_hold_cumulative_pct']) ?? 0
      ),
    }));
  }, [rows]);

  const stockSummaryRow = useMemo(() => {
    if (!rows.length) return null;
    return rows[rows.length - 1];
  }, [rows]);

  const strategyReturn =
    pickField(stockSummaryRow, [
      'strategy_return_pct',
      'Strategy_Return_Pct',
      'cumulative_return_pct',
      'strategy_cumulative_return',
      'total_return_pct',
    ]) ?? summary?.[symbol]?.strategy_return_pct;

  const buyHoldReturn =
    pickField(stockSummaryRow, [
      'buy_hold_return_pct',
      'Buy_Hold_Return_Pct',
      'benchmark_return_pct',
      'buy_and_hold_return',
    ]) ?? summary?.[symbol]?.buy_hold_return_pct;

  const maxDrawdown =
    pickField(stockSummaryRow, [
      'max_drawdown_pct',
      'Max_Drawdown_Pct',
      'max_drawdown',
      'Max_Drawdown',
    ]) ?? summary?.[symbol]?.max_drawdown_pct;

  const txCostAssumption =
    pickField(stockSummaryRow, [
      'transaction_cost_bps',
      'transaction_cost_pct',
      'slippage_cost_pct',
      'cost_per_trade',
    ]) ??
    summary?.[symbol]?.transaction_cost ??
    summary?.transaction_cost_assumption;

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title="Strategy Backtesting"
          onSelectSymbol={handleSelectSymbol}
          currentSymbol={symbol}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <LineChartIcon className="w-5 h-5 text-[#31E981]" />
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Strategy Backtesting &amp; Benchmark Evaluation
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0]">
                Out-of-sample simulation comparing AI threshold signals against passive Buy-and-Hold over historical windows.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadBacktesting(symbol)}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] hover:border-[#38D9F5]/45 text-[#38D9F5] text-xs font-bold transition-all flex items-center space-x-2 disabled:opacity-50 self-start lg:self-auto whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh Backtesting'}</span>
            </button>
          </div>

          {/* 5-Stock Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono font-semibold text-[#7B8AA8] mr-1">
              Supported Assets:
            </span>
            {SUPPORTED_FIVE_STOCKS.map(item => {
              const active = symbol === item.symbol;
              return (
                <button
                  type="button"
                  key={item.symbol}
                  onClick={() => handleSelectSymbol(item.symbol)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all border whitespace-nowrap ${
                    active
                      ? 'bg-[#31E981]/15 text-[#31E981] border-[#31E981]/45 font-bold'
                      : 'bg-[#10182B] text-[#AAB7D0] border-[rgba(125,160,255,0.18)] hover:border-[#38D9F5]/45 hover:text-[#F8FAFF]'
                  }`}
                >
                  {item.shortLabel} <span className="text-[10px] opacity-75">({item.symbol})</span>
                </button>
              );
            })}
          </div>

          {/* Strategy Execution Methodology Card */}
          <div className="bull-card p-5 sm:p-6 space-y-2.5">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-[#38D9F5]" />
              <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
                Execution Rule: Next-Session Open Entry → Same-Session Close Exit
              </h3>
            </div>
            <p className="text-xs text-[#AAB7D0] leading-relaxed">
              To eliminate look-ahead bias, signals are generated strictly from data observed at the close of session <span className="font-mono text-[#F8FAFF]">t</span>. Simulated positions enter at the next session&apos;s opening price (<span className="font-mono text-[#38D9F5]">Open<sub>t+1</sub></span>) and exit at that session&apos;s closing price (<span className="font-mono text-[#31E981]">Close<sub>t+1</sub></span>), factoring in explicit transaction cost assumptions.
            </p>
          </div>

          {!available && !loading ? (
            <UnavailableState
              title="Strategy backtesting results are currently unavailable."
              description={
                btData?.message ||
                'Historical backtesting telemetry was not returned by the active backend. No synthetic equity curves or returns are fabricated.'
              }
              onRetry={() => loadBacktesting(symbol)}
              retrying={loading}
            />
          ) : (
            <>
              {/* Key Metrics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bull-card p-5 space-y-1.5">
                  <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">Strategy Cumulative Return</span>
                  <div className="text-2xl font-extrabold font-mono text-[#31E981] tabular-nums">
                    {strategyReturn != null ? `${Number(strategyReturn).toFixed(2)}%` : 'Not available'}
                  </div>
                  <p className="text-[11px] text-[#7B8AA8]">Next-session Open-to-Close</p>
                </div>

                <div className="bull-card p-5 space-y-1.5">
                  <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">Buy-and-Hold Benchmark</span>
                  <div className="text-2xl font-extrabold font-mono text-[#38D9F5] tabular-nums">
                    {buyHoldReturn != null ? `${Number(buyHoldReturn).toFixed(2)}%` : 'Not available'}
                  </div>
                  <p className="text-[11px] text-[#7B8AA8]">Passive holding over test period</p>
                </div>

                <div className="bull-card p-5 space-y-1.5">
                  <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">Maximum Drawdown</span>
                  <div className="text-2xl font-extrabold font-mono text-[#FF586A] tabular-nums">
                    {maxDrawdown != null ? `${Number(maxDrawdown).toFixed(2)}%` : 'Not available'}
                  </div>
                  <p className="text-[11px] text-[#7B8AA8]">Peak-to-trough portfolio decline</p>
                </div>

                <div className="bull-card p-5 space-y-1.5">
                  <span className="text-[11px] font-mono text-[#7B8AA8] uppercase">Transaction Cost Model</span>
                  <div className="text-2xl font-extrabold font-mono text-[#4D8DFF] tabular-nums">
                    {txCostAssumption != null ? String(txCostAssumption) : 'Not specified'}
                  </div>
                  <p className="text-[11px] text-[#7B8AA8]">Slippage &amp; brokerage assumption</p>
                </div>
              </div>

              {/* Equity Curve Chart */}
              {curvePoints.length > 0 && (
                <ChartContainer
                  title={`Equity Curve: AI Strategy vs Buy-and-Hold (${symbol})`}
                  subtitle="Cumulative performance derived directly from backtesting records"
                  icon={TrendingUp}
                  loading={loading}
                  heightClass="h-80"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curvePoints} margin={{ top: 10, right: 14, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
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
                      <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                      <Line type="monotone" dataKey="strategy" stroke="#31E981" strokeWidth={2.4} dot={false} name="AI Strategy" />
                      <Line type="monotone" dataKey="buyHold" stroke="#38D9F5" strokeWidth={2.0} strokeDasharray="5 5" dot={false} name="Buy & Hold Benchmark" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}

              {/* Backtesting Records Table */}
              {rows.length > 0 && (
                <div className="bull-card p-5 overflow-x-auto space-y-3">
                  <h3 className="text-xs font-bold font-mono text-[#AAB7D0] uppercase tracking-wider">
                    Backtesting Records ({rows.length} rows)
                  </h3>
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-[rgba(125,160,255,0.16)] text-[#7B8AA8] uppercase text-[10px]">
                        {Object.keys(rows[0]).map(col => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(125,160,255,0.1)]">
                      {rows.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#151F36]/55 transition-colors">
                          {Object.keys(rows[0]).map(col => (
                            <td key={col} className="py-2.5 px-3 text-[#AAB7D0] tabular-nums whitespace-nowrap">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Disclosure */}
          <div className="bull-card p-5 flex items-start space-x-3 text-xs text-[#AAB7D0]">
            <ShieldCheck className="w-4 h-4 text-[#31E981] shrink-0 mt-0.5" />
            <span>
              Historical backtesting outcomes reflect past market behavior on out-of-sample test windows and do not guarantee future investment performance. Informational research use only.
            </span>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
};
