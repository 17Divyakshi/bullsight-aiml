import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { BullSightLogo } from './BullSightLogo';
import {
  Home,
  LayoutDashboard,
  TrendingUp,
  Sliders,
  Bookmark,
  Briefcase,
  Newspaper,
  Bot,
  Info,
  Settings,
  Menu,
  X,
  BarChart3,
  LineChart,
  Cpu,
} from 'lucide-react';

export const Sidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Predictions', path: '/predictions', icon: TrendingUp },
    { name: 'Market Screener', path: '/screener', icon: Sliders },
    { name: 'Model Performance', path: '/model-performance', icon: BarChart3 },
    { name: 'Backtesting', path: '/backtesting', icon: LineChart },
    { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'News & Sentiment', path: '/news', icon: Newspaper },
    { name: 'Market Assistant', path: '/ai-assistant', icon: Bot },
    { name: 'Methodology', path: '/about', icon: Info },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.25)] text-[#F8FAFF] shadow-lg hover:border-[#38D9F5]/50 transition-all"
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? <X className="w-5 h-5 text-[#38D9F5]" /> : <Menu className="w-5 h-5 text-[#31E981]" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-[#070B1A]/75 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Rail */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0A1024] border-r border-[rgba(125,160,255,0.18)] z-40 flex flex-col justify-between transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-5 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsMobileOpen(false)}
            className="block pb-5 border-b border-[rgba(125,160,255,0.18)] mb-5"
          >
            <BullSightLogo showTagline={true} />
          </Link>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                      isActive
                        ? 'bg-gradient-to-r from-[#31E981]/18 via-[#4D8DFF]/12 to-transparent text-[#31E981] border-[#31E981]/35 font-bold shadow-[0_0_20px_-6px_rgba(49,233,129,0.4)]'
                        : 'text-[#AAB7D0] hover:text-[#F8FAFF] hover:bg-[#151F36] border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#31E981]' : 'text-[#7B8AA8]'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[rgba(125,160,255,0.16)] bg-[#070B1A]/60">
          <div className="p-3.5 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.18)] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#38D9F5] font-semibold">
                AI Inference Core
              </span>
              <Cpu className="w-3.5 h-3.5 text-[#31E981]" />
            </div>
            <p className="text-xs font-bold font-display text-[#F8FAFF] leading-snug">
              See the Trend. Predict the Move.
            </p>
            <p className="text-[11px] text-[#7B8AA8] leading-snug">
              Next-session closing analytics across NIFTY 50 &amp; NSE leaders.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
