import React from 'react';

/**
 * Original BULLSIGHT emblem: geometric neon-green / cyan rising trend crest & wordmark
 */
export const BullSightLogo = ({ showTagline = false, compact = false }) => {
  return (
    <div className="flex items-center gap-3 shrink-0 whitespace-nowrap select-none group">
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#10182B] via-[#151F36] to-[#070B1A] border border-cyan-400/30 shadow-blueGlow flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-[1.04]">
        <svg
          viewBox="0 0 40 40"
          className="w-7 h-7"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bullsightTrendGrad" x1="5" y1="30" x2="35" y2="9" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4D8DFF" />
              <stop offset="50%" stopColor="#38D9F5" />
              <stop offset="100%" stopColor="#31E981" />
            </linearGradient>
            <linearGradient id="bullsightAreaGrad" x1="20" y1="12" x2="20" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#31E981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#4D8DFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Subtle architectural horizon */}
          <path d="M6 31H34" stroke="#4D8DFF" strokeOpacity="0.28" strokeWidth="1.2" strokeLinecap="round" />
          {/* Rising shaded area */}
          <path
            d="M7 28L14.5 21.5L20 24L32 11V31H7V28Z"
            fill="url(#bullsightAreaGrad)"
          />
          {/* Stylized bull-horn / ascending market trend */}
          <path
            d="M7 27.5L14.5 21L20 23.8L31.5 11.5"
            stroke="url(#bullsightTrendGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Apex chevron */}
          <path
            d="M25.5 11.2H32V17.7"
            stroke="#31E981"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Focal node */}
          <circle cx="14.5" cy="21" r="2.2" fill="#38D9F5" />
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-lg sm:text-xl font-extrabold tracking-tight font-display text-[#F8FAFF] whitespace-nowrap">
            BULL
            <span className="bg-gradient-to-r from-[#31E981] via-[#38D9F5] to-[#4D8DFF] bg-clip-text text-transparent">
              SIGHT
            </span>
          </span>
          {showTagline && (
            <span className="text-[10px] font-mono text-[#AAB7D0] tracking-wide mt-0.5 hidden sm:block">
              See the Trend. Predict the Move.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
