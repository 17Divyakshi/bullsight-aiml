import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { BackendStatusPanel } from '../components/BackendStatusPanel';
import { Footer } from '../components/Footer';
import { Settings as SettingsIcon, Key, Sliders, Check, Monitor, Info } from 'lucide-react';

export const Settings = () => {
  const [newsKey, setNewsKey] = useState(() => localStorage.getItem('NEWS_API_KEY') || '');
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('OPENAI_API_KEY') || '');
  const [showKeys, setShowKeys] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = e => {
    e.preventDefault();
    if (newsKey.trim()) {
      localStorage.setItem('NEWS_API_KEY', newsKey.trim());
    } else {
      localStorage.removeItem('NEWS_API_KEY');
    }
    if (openaiKey.trim()) {
      localStorage.setItem('OPENAI_API_KEY', openaiKey.trim());
    } else {
      localStorage.removeItem('OPENAI_API_KEY');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClearKeys = () => {
    setNewsKey('');
    setOpenaiKey('');
    localStorage.removeItem('NEWS_API_KEY');
    localStorage.removeItem('OPENAI_API_KEY');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Platform Settings" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <SettingsIcon className="w-5 h-5 text-[#38D9F5]" />
              <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                Platform Preferences &amp; Configuration
              </h2>
            </div>
            <p className="text-xs text-[#AAB7D0] mt-1">
              Review terminal workspace configuration, optional external keys, and next-session AI inference defaults.
            </p>
          </div>

          {/* Live Backend & ML Diagnostics */}
          <BackendStatusPanel />

          <form onSubmit={handleSave} className="space-y-6">
            {/* Terminal Workspace Appearance */}
            <div className="bull-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[rgba(125,160,255,0.16)]">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-[#31E981]" />
                  <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[#F8FAFF]">
                    Terminal Visual Mode
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#31E981] uppercase px-2.5 py-0.5 rounded-md bg-[#31E981]/10 border border-[#31E981]/25">
                  3D Fintech Dark
                </span>
              </div>

              <p className="text-xs text-[#AAB7D0] leading-relaxed">
                BULLSIGHT runs natively in a calibrated deep-navy dark workspace tuned for high-contrast candlestick charts, WebGL 3D scenes, and legible tabular price data. Animations automatically respect your system&apos;s <code className="font-mono text-[#38D9F5]">prefers-reduced-motion</code> setting.
              </p>
            </div>

            {/* Optional API Keys Configuration Card */}
            <div className="bull-card p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
                <div className="flex items-center space-x-2">
                  <Key className="w-4 h-4 text-[#38D9F5]" />
                  <h3 className="text-xs sm:text-sm font-bold font-display uppercase tracking-wider text-[#F8FAFF]">
                    Optional Data &amp; Assistant Keys
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowKeys(!showKeys)}
                    className="text-[11px] font-mono font-semibold text-[#AAB7D0] hover:text-[#F8FAFF] transition-colors px-2.5 py-1 rounded-lg border border-[rgba(125,160,255,0.18)]"
                  >
                    {showKeys ? 'Hide Input' : 'Show Input'}
                  </button>
                  <span className="text-[10px] font-mono font-bold text-[#38D9F5] uppercase px-2.5 py-0.5 rounded-md bg-[#38D9F5]/10 border border-[#38D9F5]/25">
                    Optional
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.16)] p-3.5 flex items-start space-x-2.5 text-xs text-[#AAB7D0]">
                <Info className="w-4 h-4 text-[#38D9F5] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Neither <span className="font-mono text-[#F8FAFF]">NEWS_API_KEY</span> nor{' '}
                  <span className="font-mono text-[#F8FAFF]">OPENAI_API_KEY</span> is required for equity charting, technical indicators, next-session forecasting, or model performance evaluation.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[#AAB7D0] font-semibold block mb-2 text-xs sm:text-sm font-sans">
                    News API Key (Optional)
                  </label>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="Optional: leave blank for curated headlines"
                    value={newsKey}
                    onChange={e => setNewsKey(e.target.value)}
                    className="w-full bg-[#070B1A] border border-[rgba(125,160,255,0.2)] rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[#AAB7D0] font-semibold block mb-2 text-xs sm:text-sm font-sans">
                    OpenAI API Key (Optional)
                  </label>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    placeholder="Optional: leave blank for built-in quantitative assistant"
                    value={openaiKey}
                    onChange={e => setOpenaiKey(e.target.value)}
                    className="w-full bg-[#070B1A] border border-[rgba(125,160,255,0.2)] rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Active Modeling Configuration Card */}
            <div className="bull-card p-6 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-[#31E981]" />
                  <h3 className="text-xs sm:text-sm font-bold font-display uppercase tracking-wider text-[#F8FAFF]">
                    Forecast Engine Defaults
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#31E981] uppercase px-2.5 py-0.5 rounded-md bg-[#31E981]/10 border border-[#31E981]/25">
                  Next-Session Only
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
                <div className="bg-[#070B1A] p-4 rounded-xl border border-[rgba(125,160,255,0.16)] space-y-1">
                  <span className="text-[#7B8AA8] block text-[10px] uppercase font-bold tracking-wider">Sequence Lookback</span>
                  <span className="text-xl font-extrabold text-[#F8FAFF] tabular-nums">60 Sessions</span>
                  <p className="text-[10px] text-[#7B8AA8] font-sans">14 engineered features</p>
                </div>
                <div className="bg-[#070B1A] p-4 rounded-xl border border-[rgba(125,160,255,0.16)] space-y-1">
                  <span className="text-[#7B8AA8] block text-[10px] uppercase font-bold tracking-wider">ML Asset Scope</span>
                  <span className="text-xl font-extrabold text-[#31E981]">5 Core NSE Assets</span>
                  <p className="text-[10px] text-[#7B8AA8] font-sans">^NSEI, RELIANCE, TCS, INFY, HDFC</p>
                </div>
                <div className="bg-[#070B1A] p-4 rounded-xl border border-[rgba(125,160,255,0.16)] space-y-1">
                  <span className="text-[#7B8AA8] block text-[10px] uppercase font-bold tracking-wider">Signal Thresholds</span>
                  <span className="text-xl font-extrabold text-[#38D9F5] tabular-nums">+1.0% / -1.0%</span>
                  <p className="text-[10px] text-[#7B8AA8] font-sans">Adjustable in AI Predictions</p>
                </div>
              </div>
            </div>

            {/* Submit Button & Notification */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] hover:shadow-bullGlow text-[#070B1A] text-xs font-extrabold transition-all flex items-center space-x-2 whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>Save Preferences</span>
              </button>

              <button
                type="button"
                onClick={handleClearKeys}
                className="px-4 py-2.5 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] hover:border-[#FF586A]/45 text-xs font-mono font-bold text-[#AAB7D0] hover:text-[#FF586A] transition-all whitespace-nowrap"
              >
                Clear Optional Keys
              </button>

              {saved && (
                <span className="text-xs font-mono text-[#31E981] flex items-center space-x-1 animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  <span>Preferences saved locally.</span>
                </span>
              )}
            </div>
          </form>

          <Footer />
        </main>
      </div>
    </div>
  );
};
