import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { TopBar } from '../components/TopBar';
import { AIChat } from '../components/AIChat';
import { Footer } from '../components/Footer';
import { Bot } from 'lucide-react';
import { STOCKS, SUPPORTED_FIVE_STOCKS } from '../data/stocks';

export const AI = () => {
  const [symbol, setSymbol] = useState('^NSEI');

  return (
    <div className="min-h-screen bg-[#070B1A] text-[#F8FAFF] flex font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title="Market Assistant" />

        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto min-w-0 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(125,160,255,0.18)]">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Bot className="w-5 h-5 text-[#38D9F5]" />
                <h2 className="text-2xl font-extrabold font-display text-[#F8FAFF] tracking-tight">
                  Quantitative Market Assistant
                </h2>
              </div>
              <p className="text-xs text-[#AAB7D0] mt-1">
                Explains technical indicators (RSI, MACD, SMA 20/50) and observed market behavior cleanly.
              </p>
            </div>

            {/* Context Selector */}
            <div className="flex items-center space-x-2 bg-[#10182B] p-1.5 rounded-xl border border-[rgba(125,160,255,0.2)] self-start sm:self-auto">
              <span className="text-xs font-mono text-[#7B8AA8] ml-2">Active Asset:</span>
              <select
                value={symbol}
                onChange={e => setSymbol(e.target.value)}
                className="bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-[#F8FAFF] focus:outline-none focus:border-[#38D9F5] max-w-[220px]"
              >
                <optgroup label="Core Supported Assets">
                  {SUPPORTED_FIVE_STOCKS.map(s => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} ({s.label})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Extended Market Catalog">
                  {STOCKS.filter(s => !s.isSupportedCore).map(s => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} ({s.name})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <AIChat symbol={symbol} />

          <Footer />
        </main>
      </div>
    </div>
  );
};
