import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BullSightLogo } from './BullSightLogo';
import { BackendStatusPanel } from './BackendStatusPanel';
import { STOCKS } from '../data/stocks';
import {
  Search,
  Settings,
  Menu,
  X,
  ChevronDown,
  LineChart,
  Newspaper,
  Bot,
  Info,
  ArrowRight,
} from 'lucide-react';

const PRIMARY_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'AI Predictions', to: '/predictions' },
  { label: 'Market', to: '/screener' },
  { label: 'Model Performance', to: '/model-performance' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Watchlist', to: '/watchlist' },
];

const MORE_LINKS = [
  { label: 'Backtesting', to: '/backtesting', icon: LineChart },
  { label: 'News & Sentiment', to: '/news', icon: Newspaper },
  { label: 'Market Assistant', to: '/ai-assistant', icon: Bot },
  { label: 'Methodology', to: '/about', icon: Info },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const moreRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const onDocClick = e => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    const onKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 40);
      } else if (e.key === 'Escape') {
        setMoreOpen(false);
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const filteredStocks = STOCKS.filter(s => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return s.isSupportedCore || s.isPopular;
    return (
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.sector.toLowerCase().includes(q)
    );
  }).slice(0, 8);

  const handleSelectTicker = sym => {
    setSearchOpen(false);
    setSearchQuery('');
    setMobileOpen(false);
    navigate(`/dashboard?symbol=${encodeURIComponent(sym)}`);
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-[#070B1A]/85 backdrop-blur-md border-b border-[rgba(125,160,255,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: BULLSIGHT Brand Logo */}
        <Link to="/" className="shrink-0" onClick={() => setMobileOpen(false)}>
          <BullSightLogo showTagline={false} />
        </Link>

        {/* Center: Primary Navigation */}
        <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[#AAB7D0]">
          {PRIMARY_LINKS.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative whitespace-nowrap shrink-0 py-2 transition-colors ${
                  active
                    ? 'text-[#F8FAFF] font-bold'
                    : 'hover:text-[#F8FAFF]'
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="bullsight-nav-underline"
                    className="absolute left-0 right-0 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-[#31E981] to-[#38D9F5] shadow-[0_0_10px_rgba(49,233,129,0.7)]"
                  />
                )}
              </Link>
            );
          })}

          {/* More Routes Dropdown */}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen(prev => !prev)}
              className={`flex items-center gap-1 whitespace-nowrap shrink-0 py-2 transition-colors ${
                MORE_LINKS.some(l => l.to === location.pathname)
                  ? 'text-[#31E981] font-bold'
                  : 'text-[#AAB7D0] hover:text-[#F8FAFF]'
              }`}
            >
              <span>Analytics</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {moreOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 mt-2 w-52 rounded-2xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] shadow-cardHover p-1.5 z-50"
                >
                  {MORE_LINKS.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setMoreOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          active
                            ? 'bg-[#31E981]/12 text-[#31E981] font-bold'
                            : 'text-[#AAB7D0] hover:text-[#F8FAFF] hover:bg-[#151F36]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right: Live Backend Status, Search & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          <BackendStatusPanel compact={true} />
          <div ref={searchRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setSearchOpen(prev => !prev);
                setTimeout(() => searchInputRef.current?.focus(), 40);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.2)] hover:border-[#38D9F5]/45 text-xs font-mono text-[#AAB7D0] hover:text-[#F8FAFF] transition-all whitespace-nowrap"
              aria-label="Search ticker"
            >
              <Search className="w-3.5 h-3.5 text-[#38D9F5]" />
              <span className="hidden sm:inline">Search ticker</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[9px] rounded bg-[#151F36] border border-[rgba(125,160,255,0.18)] text-[#AAB7D0]">
                ⌘K
              </kbd>
            </button>

            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#10182B] border border-[rgba(125,160,255,0.25)] shadow-cardHover p-3 z-50 space-y-2.5"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#38D9F5] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          e.preventDefault();
                          handleSelectTicker(searchQuery.trim().toUpperCase());
                        }
                      }}
                      placeholder="Jump to ticker (e.g. ^NSEI, RELIANCE.NS)..."
                      className="w-full bg-[#070B1A] border border-[rgba(125,160,255,0.22)] rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5]"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {filteredStocks.map(s => (
                      <button
                        key={s.symbol}
                        type="button"
                        onClick={() => handleSelectTicker(s.symbol)}
                        className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-left hover:bg-[#151F36] transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="font-mono text-xs font-bold text-[#F8FAFF] block">
                            {s.symbol}
                          </span>
                          <span className="text-[11px] text-[#AAB7D0] truncate block">
                            {s.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#38D9F5] shrink-0 ml-2">
                          {s.exchange}
                        </span>
                      </button>
                    ))}
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => handleSelectTicker(searchQuery.trim().toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-[#31E981] bg-[#31E981]/10 border border-[#31E981]/25 hover:bg-[#31E981]/15"
                      >
                        <span>Open &ldquo;{searchQuery.trim().toUpperCase()}&rdquo; in Dashboard</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/settings"
            className={`p-2 rounded-xl border transition-all ${
              location.pathname === '/settings'
                ? 'bg-[#38D9F5]/15 border-[#38D9F5]/45 text-[#38D9F5]'
                : 'bg-[#10182B] border-[rgba(125,160,255,0.2)] text-[#AAB7D0] hover:text-[#F8FAFF] hover:border-[#38D9F5]/40'
            }`}
            title="Platform Settings"
            aria-label="Platform Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen(prev => !prev)}
            className="xl:hidden p-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.2)] text-[#F8FAFF] hover:border-[#38D9F5]/45 transition-all"
            aria-label="Toggle mobile navigation"
          >
            {mobileOpen ? <X className="w-4 h-4 text-[#38D9F5]" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Animated Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="xl:hidden overflow-hidden border-t border-[rgba(125,160,255,0.18)] bg-[#0A1024]/95 backdrop-blur-md"
          >
            <nav className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-semibold">
              {[...PRIMARY_LINKS, ...MORE_LINKS, { label: 'Settings', to: '/settings' }].map(item => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3.5 py-2.5 rounded-xl border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#31E981]/12 border-[#31E981]/40 text-[#31E981] font-bold'
                        : 'bg-[#10182B] border-[rgba(125,160,255,0.14)] text-[#AAB7D0] hover:text-[#F8FAFF]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
