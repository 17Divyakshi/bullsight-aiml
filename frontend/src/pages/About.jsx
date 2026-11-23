import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { Footer } from '../components/Footer';
import { Info, ArrowDown, ShieldCheck, Layers, BarChart3, Database } from 'lucide-react';

export const About = () => {
  const pipelineSteps = [
    {
      step: '01. Observed OHLCV Ingestion',
      detail: 'Daily open, high, low, close, and volume bars fetched across NIFTY 50 & NSE leaders',
      accent: 'text-[#38D9F5] border-[rgba(56,217,245,0.25)] bg-[#10182B]',
    },
    {
      step: '02. 14-Feature Technical Engineering',
      detail: 'RSI (14), MACD (12, 26, 9), SMA 20/50, EMA 20, ATR, Bollinger bands, and lagged returns',
      accent: 'text-[#4D8DFF] border-[rgba(77,141,255,0.25)] bg-[#10182B]',
    },
    {
      step: '03. Sequence Normalization & Scaling',
      detail: 'Leakage-free feature scaling aligned to 60-trading-day lookback windows',
      accent: 'text-[#9065FF] border-[rgba(144,101,255,0.25)] bg-[#10182B]',
    },
    {
      step: '04. Multi-Model Benchmarking & Selection',
      detail: 'Linear Regression, Random Forest, LSTM, and Previous Close Baseline ranked by lowest validation MAE',
      accent: 'text-[#31E981] border-[rgba(49,233,129,0.3)] bg-[#31E981]/10',
    },
    {
      step: '05. Next-Session Signal & Backtesting',
      detail: 'Single-step next-session close forecast with configurable BUY/SELL thresholds and Open(t+1)→Close(t+1) simulation',
      accent: 'text-[#F8FAFF] border-[rgba(56,217,245,0.3)] bg-[#38D9F5]/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Methodology & Architecture" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="pb-4 border-b border-[rgba(125,160,255,0.18)] space-y-1">
            <div className="flex items-center space-x-2">
              <Info className="w-5 h-5 text-[#31E981]" />
              <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                Quantitative Forecasting Methodology
              </h2>
            </div>
            <p className="text-xs text-[#AAB7D0] font-mono">
              BULLSIGHT · See the Trend. Predict the Move.
            </p>
          </div>

          {/* Overview & Pipeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bull-card p-6 space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[rgba(125,160,255,0.16)]">
                <Database className="w-4 h-4 text-[#38D9F5]" />
                <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
                  Platform Architecture &amp; Data Discipline
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#AAB7D0] leading-relaxed">
                <strong className="text-[#F8FAFF]">BULLSIGHT</strong> combines observed NSE equity series, interactive 2D and 3D candlestick visualizations, and verified single-step next-session inference across five flagship assets: <code className="text-[#31E981] font-mono">^NSEI</code>, <code className="text-[#31E981] font-mono">RELIANCE.NS</code>, <code className="text-[#31E981] font-mono">TCS.NS</code>, <code className="text-[#31E981] font-mono">INFY.NS</code>, and <code className="text-[#31E981] font-mono">HDFCBANK.NS</code>.
              </p>
              <p className="text-xs text-[#7B8AA8] leading-relaxed">
                Rather than fabricating multi-day trajectories or synthetic confidence percentages, every prediction, evaluation metric, and backtest displayed in BULLSIGHT traces directly to observed market closes and trained model artifacts.
              </p>
            </div>

            {/* Data Pipeline Flowchart */}
            <div className="bull-card p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,255,0.16)]">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#31E981]" />
                  <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
                    End-to-End Inference Pipeline
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[#38D9F5] font-semibold">5 Stages</span>
              </div>

              <div className="flex flex-col items-center space-y-2.5 text-xs font-mono">
                {pipelineSteps.map((item, idx) => (
                  <React.Fragment key={item.step}>
                    <div className={`w-full p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${item.accent}`}>
                      <span className="font-bold">{item.step}</span>
                      <span className="text-[#AAB7D0] text-[11px] font-sans">{item.detail}</span>
                    </div>
                    {idx < pipelineSteps.length - 1 && (
                      <ArrowDown className="w-3.5 h-3.5 text-[#38D9F5]" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Regression Evaluation Standards */}
          <div className="bull-card p-6 space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-[rgba(125,160,255,0.16)]">
              <BarChart3 className="w-4 h-4 text-[#38D9F5]" />
              <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
                Transparent Evaluation &amp; Backtesting Standards
              </h3>
            </div>
            <p className="text-xs text-[#AAB7D0] leading-relaxed">
              Closing price forecasting is evaluated using continuous regression error metrics and leakage-free out-of-sample simulation rules:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1 text-xs">
              <div className="p-4 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.16)] space-y-1.5">
                <strong className="text-[#31E981] block font-display text-sm">MAE</strong>
                <p className="text-[#AAB7D0] leading-relaxed">
                  Mean Absolute Error in currency/index units — primary criterion for selecting the top-performing model.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.16)] space-y-1.5">
                <strong className="text-[#38D9F5] block font-display text-sm">RMSE</strong>
                <p className="text-[#AAB7D0] leading-relaxed">
                  Root Mean Squared Error highlighting sensitivity to large session-to-session price swings.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.16)] space-y-1.5">
                <strong className="text-[#4D8DFF] block font-display text-sm">R² &amp; MAPE</strong>
                <p className="text-[#AAB7D0] leading-relaxed">
                  Variance explained and mean absolute percentage deviation across hold-out evaluation windows.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.16)] space-y-1.5">
                <strong className="text-[#9065FF] block font-display text-sm">Open<sub>t+1</sub> → Close<sub>t+1</sub></strong>
                <p className="text-[#AAB7D0] leading-relaxed">
                  Backtesting enters at the next session&apos;s open and exits at its close with transaction cost assumptions.
                </p>
              </div>
            </div>
          </div>

          {/* Financial Disclosure */}
          <div className="bull-card p-6 space-y-2 border-[rgba(255,88,106,0.22)]">
            <div className="flex items-center space-x-2 text-[#38D9F5]">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="text-xs font-bold font-display uppercase tracking-wider">
                Experimental Research Notice
              </h3>
            </div>
            <p className="text-xs text-[#AAB7D0] leading-relaxed">
              BULLSIGHT provides quantitative market analytics, 3D candlestick visualizations, and experimental next-session signals strictly for educational and informational research purposes. Nothing presented constitutes financial or investment advice.
            </p>
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
};
