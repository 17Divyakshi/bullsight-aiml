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
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  Cpu,
  BarChart3,
  RefreshCw,
  LineChart as LineChartIcon,
  Info,
  Sparkles,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';

const MODEL_SLOTS = [
  {
    key: 'linear_regression',
    name: 'Linear Regression',
    role: 'Parametric Linear Trend Benchmark',
    color: '#38D9F5',
  },
  {
    key: 'random_forest',
    name: 'Random Forest',
    role: 'Non-Linear Ensemble Regressor',
    color: '#4D8DFF',
  },
  {
    key: 'lstm',
    name: 'LSTM',
    role: 'Deep Sequence Neural Network',
    color: '#31E981',
  },
  {
    key: 'previous_close_baseline',
    name: 'Previous Close Baseline',
    role: 'Naive Persistence Reference (t-1)',
    color: '#9065FF',
  },
];

function pickNum(obj, keys) {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '' && !Number.isNaN(Number(obj[k]))) {
      return Number(obj[k]);
    }
  }
  return null;
}

function pickStr(obj, keys) {
  if (!obj) return null;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      return String(obj[k]);
    }
  }
  return null;
}

function matchBackendModel(modelsList, slot) {
  if (!Array.isArray(modelsList)) return null;
  const target = slot.name.toLowerCase();
  return (
    modelsList.find(m => {
      const label = String(m?.name || m?.model || m?.Model || m?.id || '').toLowerCase();
      return (
        label === target ||
        label.includes(slot.key) ||
        label.includes(target.split(' ')[0])
      );
    }) || null
  );
}

export const ModelPerformance = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(SUPPORTED_FIVE_STOCKS[0].symbol);
  const [metrics, setMetrics] = useState(null);
  const [stockPred, setStockPred] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPerformanceData = useCallback(async (sym = selectedSymbol) => {
    setLoading(true);
    try {
      const [metricsData, predData] = await Promise.all([
        stockAPI.getModelMetrics(sym),
        stockAPI.getPrediction(sym),
      ]);
      setMetrics(metricsData);
      setStockPred(predData);
    } catch (err) {
      console.error('Error fetching model metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    fetchPerformanceData(selectedSymbol);
  }, [selectedSymbol, fetchPerformanceData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPerformanceData(selectedSymbol);
  };

  const hasArtifacts = Boolean(metrics?.ml_verified || metrics?.artifacts_available);

  const modelRows = useMemo(() => {
    const backendModels = metrics?.models || null;
    const selectedName = String(metrics?.selected_model || stockPred?.selected_model || '').toLowerCase();

    const rows = MODEL_SLOTS.map(slot => {
      const matched = matchBackendModel(backendModels, slot);
      const mae = pickNum(matched, ['mae', 'MAE']);
      const rmse = pickNum(matched, ['rmse', 'RMSE']);
      const r2 = pickNum(matched, ['r2', 'r2_score', 'R2', 'R2_Score']);
      const mape = pickNum(matched, ['mape', 'MAPE']);
      const directionalAccuracy = pickNum(matched, ['directional_accuracy', 'Directional_Accuracy', 'dir_acc']);

      const isExplicitlySelected =
        Boolean(selectedName) &&
        (selectedName.includes(slot.name.toLowerCase()) || selectedName.includes(slot.key));

      return {
        ...slot,
        mae,
        rmse,
        r2,
        mape,
        directionalAccuracy,
        isExplicitlySelected,
        hasAnyMetric: mae != null || rmse != null || r2 != null || mape != null || directionalAccuracy != null,
      };
    });

    // If backend didn't specify selected_model string, highlight lowest reported MAE among non-baseline models
    const hasExplicitWinner = rows.some(r => r.isExplicitlySelected);
    if (!hasExplicitWinner) {
      const candidates = rows.filter(r => r.mae != null && r.key !== 'previous_close_baseline');
      if (candidates.length > 0) {
        const best = candidates.reduce((a, b) => (a.mae <= b.mae ? a : b));
        best.isExplicitlySelected = true;
      }
    }

    return rows;
  }, [metrics, stockPred]);

  const winnerRow = useMemo(() => modelRows.find(r => r.isExplicitlySelected) || null, [modelRows]);

  const errorChartData = useMemo(() => {
    return modelRows
      .filter(r => r.mae != null || r.rmse != null)
      .map(r => ({
        name: r.name,
        MAE: r.mae,
        RMSE: r.rmse,
        color: r.color,
      }));
  }, [modelRows]);

  const testSeries = useMemo(() => {
    const raw = metrics?.test_predictions;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw
      .map((row, idx) => ({
        date: pickStr(row, ['date', 'Date', 'trading_date']) || `Step ${idx + 1}`,
        actual: pickNum(row, ['actual', 'Actual', 'y_true', 'actual_close', 'Actual_Close']),
        predicted: pickNum(row, ['predicted', 'Predicted', 'y_pred', 'predicted_close', 'Predicted_Close']),
      }))
      .filter(r => r.actual != null || r.predicted != null);
  }, [metrics]);

  const featureImportance = useMemo(() => {
    const raw = metrics?.feature_importance;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw
      .map(row => ({
        feature: pickStr(row, ['feature', 'Feature', 'name', 'Name']) || 'Feature',
        importance: pickNum(row, ['importance', 'Importance', 'score', 'Score']) ?? 0,
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 14);
  }, [metrics]);

  const lstmHistory = useMemo(() => {
    const raw = metrics?.lstm_history;
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((row, idx) => ({
      epoch: pickNum(row, ['epoch', 'Epoch']) ?? idx + 1,
      loss: pickNum(row, ['loss', 'train_loss', 'Loss']),
      valLoss: pickNum(row, ['val_loss', 'validation_loss', 'Val_Loss']),
    }));
  }, [metrics]);

  const formatMetric = (val, suffix = '') =>
    val != null && !Number.isNaN(val) ? `${Number(val).toFixed(2)}${suffix}` : 'Not reported';

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title="Model Performance"
          onSelectSymbol={setSelectedSymbol}
          currentSymbol={selectedSymbol}
        />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-5 h-5 text-[#31E981]" />
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Historical Model Evaluation &amp; Benchmarks
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0]">
                Historical evaluation results comparing Linear Regression, Random Forest, LSTM, and Previous Close Baseline by validation MAE.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center space-x-1 bg-[#10182B] p-1 rounded-xl border border-[rgba(125,160,255,0.2)]">
                {SUPPORTED_FIVE_STOCKS.map(s => (
                  <button
                    type="button"
                    key={s.symbol}
                    onClick={() => setSelectedSymbol(s.symbol)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all whitespace-nowrap ${
                      selectedSymbol === s.symbol
                        ? 'bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A]'
                        : 'text-[#7B8AA8] hover:text-[#F8FAFF]'
                    }`}
                  >
                    {s.shortLabel}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="px-4 py-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] hover:border-[#38D9F5]/45 text-[#38D9F5] text-xs font-bold transition-all flex items-center space-x-2 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
              </button>
            </div>
          </div>

          {/* Pipeline Overview Banner */}
          <div className="bull-card p-5 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#38D9F5]" />
                <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
                  Evaluation Selection Protocol · {selectedSymbol}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#31E981] font-semibold">
                Selection Criterion: {metrics?.selection_criterion || 'Lowest validation MAE'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="md:col-span-2 p-3.5 rounded-xl bg-[#070B1A]/80 border border-[rgba(125,160,255,0.16)]">
                <span className="text-[#7B8AA8] block text-[10px] uppercase mb-1">Active Selected Model</span>
                <p className="text-[#F8FAFF] font-semibold">
                  {metrics?.selected_model || winnerRow?.name || 'Awaiting exported model evaluation artifacts'}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#070B1A]/80 border border-[rgba(125,160,255,0.16)] flex flex-col justify-center">
                <span className="text-[#7B8AA8] block text-[10px] uppercase mb-1">Artifact Verification</span>
                <p className={`font-bold ${hasArtifacts ? 'text-[#31E981]' : 'text-[#FF586A]'}`}>
                  {hasArtifacts ? 'Verified Exported CSVs Loaded' : 'Unavailable (Awaiting Export CSVs)'}
                </p>
              </div>
            </div>
          </div>

          {!loading && !hasArtifacts ? (
            <UnavailableState
              title="Historical evaluation results are currently unavailable."
              description={
                metrics?.message ||
                'Exported model_metrics.csv and test_predictions.csv artifacts were not found in the active backend export directory.'
              }
              onRetry={handleRefresh}
              retrying={refreshing}
            />
          ) : (
            <>
              {/* 4-Model Benchmark Cards */}
              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#31E981]" />
                    <h3 className="text-xs font-bold font-mono text-[#AAB7D0] uppercase tracking-wider">
                      Historical Model Comparison ({selectedSymbol})
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#7B8AA8] font-mono">
                    Lowest validation MAE model highlighted automatically
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {modelRows.map(row => (
                    <div
                      key={row.key}
                      className={`bull-card p-5 space-y-3 flex flex-col justify-between ${
                        row.isExplicitlySelected ? 'ring-2 ring-[#31E981] border-[#31E981]/45' : ''
                      }`}
                    >
                      <div className="space-y-1 pb-2.5 border-b border-[rgba(125,160,255,0.14)]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-extrabold font-display text-[#F8FAFF]">
                            {row.name}
                          </span>
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: row.color }}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] text-[#7B8AA8]">{row.role}</p>
                          {row.isExplicitlySelected && (
                            <span className="text-[10px] font-mono font-bold text-[#31E981]">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-[#7B8AA8]">MAE</span>
                          <span className="font-bold text-[#F8FAFF] tabular-nums">{formatMetric(row.mae)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7B8AA8]">RMSE</span>
                          <span className="font-bold text-[#F8FAFF] tabular-nums">{formatMetric(row.rmse)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7B8AA8]">R²</span>
                          <span className="font-bold text-[#38D9F5] tabular-nums">{formatMetric(row.r2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7B8AA8]">MAPE</span>
                          <span className="font-bold text-[#F8FAFF] tabular-nums">{formatMetric(row.mape, '%')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7B8AA8]">Dir. Accuracy</span>
                          <span className="font-bold text-[#AAB7D0] tabular-nums">
                            {formatMetric(row.directionalAccuracy, '%')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartContainer
                  title="Regression Error Comparison (MAE & RMSE)"
                  subtitle="Lower MAE and RMSE indicate tighter historical closing-price tracking"
                  icon={BarChart3}
                  loading={loading}
                  heightClass="h-72"
                >
                  {errorChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={errorChartData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
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
                        <Bar dataKey="MAE" fill="#31E981" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="RMSE" fill="#4D8DFF" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-[#7B8AA8] text-center px-6">
                      No MAE/RMSE comparison rows reported for {selectedSymbol}.
                    </div>
                  )}
                </ChartContainer>

                <ChartContainer
                  title="Actual vs Predicted Hold-Out Test Curve"
                  subtitle="Out-of-sample validation close vs predicted values"
                  icon={LineChartIcon}
                  loading={loading}
                  heightClass="h-72"
                >
                  {testSeries && testSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={testSeries} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
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
                        <Line type="monotone" dataKey="actual" stroke="#38D9F5" strokeWidth={2.2} dot={false} name="Actual Close" />
                        <Line type="monotone" dataKey="predicted" stroke="#31E981" strokeWidth={2.2} strokeDasharray="4 4" dot={false} name="Predicted Close" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs font-mono text-[#7B8AA8] text-center px-6">
                      No hold-out validation prediction curve returned yet.
                    </div>
                  )}
                </ChartContainer>
              </div>

              {/* Optional Feature Importance & LSTM Loss Curves */}
              {(featureImportance || lstmHistory) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {featureImportance && (
                    <ChartContainer
                      title="Random Forest Feature Importance"
                      subtitle="Relative contribution across the 14 engineered technical indicators"
                      icon={Layers}
                      loading={loading}
                      heightClass="h-72"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={featureImportance} layout="vertical" margin={{ top: 6, right: 16, left: 28, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" horizontal={false} />
                          <XAxis type="number" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <YAxis type="category" dataKey="feature" width={95} tick={{ fill: '#AAB7D0', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#10182B',
                              borderColor: 'rgba(125,160,255,0.28)',
                              borderRadius: 12,
                              fontSize: 11,
                              fontFamily: 'JetBrains Mono',
                            }}
                          />
                          <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                            {featureImportance.map((_, idx) => (
                              <Cell key={idx} fill={idx < 3 ? '#31E981' : '#38D9F5'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}

                  {lstmHistory && (
                    <ChartContainer
                      title="LSTM Training & Validation Loss"
                      subtitle="Epoch convergence history exported from training run"
                      icon={LineChartIcon}
                      loading={loading}
                      heightClass="h-72"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lstmHistory} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(125,160,255,0.12)" vertical={false} />
                          <XAxis dataKey="epoch" tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <YAxis tick={{ fill: '#7B8AA8', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#10182B',
                              borderColor: 'rgba(125,160,255,0.28)',
                              borderRadius: 12,
                              fontSize: 11,
                              fontFamily: 'JetBrains Mono',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                          <Line type="monotone" dataKey="loss" stroke="#4D8DFF" strokeWidth={2} dot={false} name="Training Loss" />
                          <Line type="monotone" dataKey="valLoss" stroke="#31E981" strokeWidth={2} dot={false} name="Validation Loss" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  )}
                </div>
              )}

              {/* Exported Diagnostic Plots Gallery if available */}
              {Array.isArray(metrics?.plots) && metrics.plots.length > 0 && (
                <div className="bull-card p-5 sm:p-6 space-y-4">
                  <div className="flex items-center space-x-2 pb-3 border-b border-[rgba(125,160,255,0.14)]">
                    <ImageIcon className="w-4 h-4 text-[#38D9F5]" />
                    <h3 className="text-xs font-bold font-mono text-[#AAB7D0] uppercase tracking-wider">
                      Exported Evaluation Plots
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metrics.plots.map(filename => (
                      <div key={filename} className="rounded-xl overflow-hidden border border-[rgba(125,160,255,0.18)] bg-[#070B1A] p-3 space-y-2">
                        <span className="text-[11px] font-mono text-[#AAB7D0] block">{filename}</span>
                        <img
                          src={`/api/ce2/plots/${encodeURIComponent(filename)}`}
                          alt={filename}
                          className="w-full rounded-lg object-contain max-h-72"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transparent Evaluation Table */}
              <div className="bull-card p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[rgba(125,160,255,0.16)]">
                  <h3 className="text-xs font-bold font-mono text-[#AAB7D0] uppercase tracking-wider">
                    Comprehensive Historical Evaluation Matrix
                  </h3>
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#7B8AA8]">
                    <Info className="w-3.5 h-3.5 text-[#38D9F5]" />
                    <span>Unreported entries remain explicitly labeled &ldquo;Not reported&rdquo;.</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-[rgba(125,160,255,0.16)] text-[#7B8AA8] uppercase text-[10px]">
                        <th className="py-2.5 px-3">Model</th>
                        <th className="py-2.5 px-3">MAE</th>
                        <th className="py-2.5 px-3">RMSE</th>
                        <th className="py-2.5 px-3">R²</th>
                        <th className="py-2.5 px-3">MAPE</th>
                        <th className="py-2.5 px-3 text-right">Directional Accuracy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(125,160,255,0.1)]">
                      {modelRows.map(row => (
                        <tr key={row.key} className="hover:bg-[#151F36]/60 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#F8FAFF] flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: row.color }} />
                            <span>{row.name}</span>
                            {row.isExplicitlySelected && (
                              <span className="text-[10px] text-[#31E981] font-semibold">· Selected</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#AAB7D0] tabular-nums">{formatMetric(row.mae)}</td>
                          <td className="py-3 px-3 text-[#AAB7D0] tabular-nums">{formatMetric(row.rmse)}</td>
                          <td className="py-3 px-3 font-bold text-[#38D9F5] tabular-nums">{formatMetric(row.r2)}</td>
                          <td className="py-3 px-3 text-[#AAB7D0] tabular-nums">{formatMetric(row.mape, '%')}</td>
                          <td className="py-3 px-3 text-[#AAB7D0] tabular-nums text-right">
                            {formatMetric(row.directionalAccuracy, '%')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          <Footer />
        </main>
      </div>
    </div>
  );
};
