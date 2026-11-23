import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from './SearchBar';
import { BackendStatusPanel } from './BackendStatusPanel';
import { ChevronDown, Settings, BookOpen, Cpu } from 'lucide-react';

export const TopBar = ({
  title = 'Dashboard',
  onSelectSymbol,
  currentSymbol = '^NSEI',
}) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[rgba(125,160,255,0.18)] bg-[#070B1A]/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 pl-11 lg:pl-0">
          <div className="flex items-center space-x-2 text-[11px] font-mono text-[#7B8AA8]">
            <span className="font-semibold text-[#F8FAFF]">BULLSIGHT</span>
            <span>/</span>
            <span className="text-[#31E981] font-semibold">{title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-extrabold font-display tracking-tight text-[#F8FAFF] truncate mt-0.5">
            {title}
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {onSelectSymbol && (
            <div className="hidden sm:block w-52 lg:w-64">
              <SearchBar onSelectSymbol={onSelectSymbol} currentSymbol={currentSymbol} />
            </div>
          )}

          <BackendStatusPanel compact={true} />

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(prev => !prev)}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[rgba(125,160,255,0.2)] bg-[#10182B] hover:border-[#38D9F5]/45 transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#4D8DFF] via-[#38D9F5] to-[#31E981] text-[#070B1A] flex items-center justify-center font-display font-extrabold text-xs shrink-0">
                BS
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-[#F8FAFF] leading-tight whitespace-nowrap">
                  Market Suite
                </div>
                <div className="text-[10px] font-mono text-[#38D9F5] whitespace-nowrap">
                  AI Intelligence
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#AAB7D0] hidden sm:block" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-[rgba(125,160,255,0.22)] bg-[#10182B] shadow-cardHover p-2 z-50 text-xs font-medium animate-fade-in">
                <div className="px-3 py-2 border-b border-[rgba(125,160,255,0.16)] mb-1">
                  <p className="font-bold font-display text-[#F8FAFF]">BULLSIGHT</p>
                  <p className="text-[10px] font-mono text-[#31E981] flex items-center space-x-1 mt-0.5">
                    <Cpu className="w-3 h-3" />
                    <span>See the Trend. Predict the Move.</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/about');
                  }}
                  className="w-full text-left px-3 py-2 text-[#AAB7D0] hover:text-[#F8FAFF] hover:bg-[#151F36] rounded-lg transition-colors flex items-center space-x-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#38D9F5]" />
                  <span>Methodology &amp; Models</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full text-left px-3 py-2 text-[#AAB7D0] hover:text-[#F8FAFF] hover:bg-[#151F36] rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Settings className="w-3.5 h-3.5 text-[#9065FF]" />
                  <span>Platform Settings</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
