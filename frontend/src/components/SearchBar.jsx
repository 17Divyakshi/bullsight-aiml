import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { STOCKS } from '../data/stocks';

export const SearchBar = ({ onSelectSymbol, currentSymbol = '^NSEI' }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [marketFilter, setMarketFilter] = useState('ALL');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filtered = STOCKS.filter(s => {
    const matchesQuery =
      s.symbol.toLowerCase().includes(query.toLowerCase()) ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.sector.toLowerCase().includes(query.toLowerCase());

    const matchesCategory =
      marketFilter === 'ALL' ||
      (marketFilter === 'US' && s.market === 'US') ||
      (marketFilter === 'INDIAN' && s.market === 'INDIAN') ||
      (marketFilter === 'CRYPTO' && s.market === 'CRYPTO');

    return matchesQuery && matchesCategory;
  });

  const handleSelect = sym => {
    onSelectSymbol(sym.trim().toUpperCase());
    setQuery('');
    setIsOpen(false);
  };

  const exactMatchExists = STOCKS.some(
    s => s.symbol.toUpperCase() === query.trim().toUpperCase()
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="w-4 h-4 text-[#38D9F5] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search ticker (^NSEI, RELIANCE.NS)..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) {
              e.preventDefault();
              handleSelect(query.trim());
            }
          }}
          className="w-full bg-[#10182B] border border-[rgba(125,160,255,0.22)] rounded-xl pl-10 pr-14 py-2 text-xs font-mono text-[#F8FAFF] placeholder-[#7B8AA8] focus:outline-none focus:border-[#38D9F5] transition-all"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-[#7B8AA8] hover:text-[#F8FAFF] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono text-[#7B8AA8] bg-[#151F36] border border-[rgba(125,160,255,0.18)] rounded">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#10182B] border border-[rgba(125,160,255,0.25)] rounded-2xl shadow-cardHover z-50 max-h-80 overflow-y-auto p-1.5 animate-fade-in">
          <div className="flex items-center space-x-1 p-1 border-b border-[rgba(125,160,255,0.16)] text-[10px] font-mono">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'INDIAN', label: 'NSE India' },
              { id: 'US', label: 'US' },
              { id: 'CRYPTO', label: 'Crypto/ETF' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setMarketFilter(cat.id);
                }}
                className={`px-2 py-0.5 rounded-lg transition-colors font-medium whitespace-nowrap ${
                  marketFilter === cat.id
                    ? 'bg-[#31E981]/15 text-[#31E981] font-bold border border-[#31E981]/35'
                    : 'text-[#7B8AA8] hover:text-[#F8FAFF] hover:bg-[#151F36]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-[#7B8AA8] uppercase tracking-wider flex justify-between">
            <span>Equities ({filtered.length})</span>
            <span>Exchange</span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-4 text-center space-y-2">
              <p className="text-xs text-[#7B8AA8]">
                No catalog match for &ldquo;{query}&rdquo;.
              </p>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim())}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#31E981]/15 text-[#31E981] border border-[#31E981]/35 text-xs font-mono font-bold hover:bg-[#31E981]/20 transition-all"
                >
                  <span>Load ticker &ldquo;{query.trim().toUpperCase()}&rdquo;</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <>
              {filtered.map(item => (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelect(item.symbol)}
                  className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                    currentSymbol === item.symbol
                      ? 'bg-[#31E981]/12 text-[#31E981] font-semibold border border-[#31E981]/30'
                      : 'text-[#F8FAFF] hover:bg-[#151F36]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="font-mono font-bold text-xs shrink-0">{item.symbol}</span>
                    <span className="text-xs text-[#AAB7D0] truncate max-w-[120px] sm:max-w-xs">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#151F36] text-[#38D9F5] border border-[rgba(125,160,255,0.16)] shrink-0">
                    {item.exchange}
                  </span>
                </button>
              ))}

              {query.trim() && !exactMatchExists && (
                <button
                  type="button"
                  onClick={() => handleSelect(query.trim())}
                  className="w-full mt-1 px-3 py-2 rounded-xl flex items-center justify-between text-left bg-[#4D8DFF]/10 hover:bg-[#4D8DFF]/20 text-[#38D9F5] border border-[#4D8DFF]/30 transition-colors"
                >
                  <div className="flex items-center space-x-2 font-mono text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Open &ldquo;{query.trim().toUpperCase()}&rdquo;</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
