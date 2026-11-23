import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { BullSightLogo } from './BullSightLogo';

export const Footer = () => {
  return (
    <footer className="w-full bg-[#0A1024]/90 border-t border-[rgba(125,160,255,0.18)] py-10 mt-14 text-center text-xs text-[#7B8AA8] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <BullSightLogo showTagline={true} />
          <p className="text-xs text-[#AAB7D0] font-medium pt-1">
            Predict the Market. See Beyond the Numbers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-[#AAB7D0]">
          <Link to="/" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Home</Link>
          <Link to="/dashboard" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Dashboard</Link>
          <Link to="/predictions" className="hover:text-[#31E981] transition-colors whitespace-nowrap">AI Predictions</Link>
          <Link to="/screener" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Market</Link>
          <Link to="/model-performance" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Model Performance</Link>
          <Link to="/backtesting" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Backtesting</Link>
          <Link to="/portfolio" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Portfolio</Link>
          <Link to="/watchlist" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Watchlist</Link>
          <Link to="/about" className="hover:text-[#31E981] transition-colors whitespace-nowrap">Methodology</Link>
        </div>

        <div className="max-w-3xl mx-auto space-y-2 pt-5 border-t border-[rgba(125,160,255,0.14)]">
          <div className="flex items-center justify-center space-x-1.5 text-[#F8FAFF]">
            <ShieldCheck className="w-4 h-4 text-[#31E981]" />
            <span className="font-bold text-xs tracking-wide font-display">
              BULLSIGHT · Quantitative Market Disclosure
            </span>
          </div>
          <p className="leading-relaxed text-[11px] text-[#7B8AA8]">
            BULLSIGHT delivers AI-powered next-session equity analytics, 3D candlestick visualization, and technical indicator intelligence. Experimental signals and statistical forecasts are provided strictly for informational and educational research purposes and do not constitute investment advice.
          </p>
          <p className="text-[10px] text-[#7B8AA8] font-mono pt-1">
            © 2026 BULLSIGHT · See the Trend. Predict the Move.
          </p>
        </div>
      </div>
    </footer>
  );
};
