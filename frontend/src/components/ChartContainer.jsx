import React from 'react';
import { motion } from 'framer-motion';

/**
 * Consistent dark futuristic chart container shared across Dashboard,
 * Predictions, Model Performance, and Backtesting views.
 */
export const ChartContainer = ({
  title,
  subtitle,
  icon: Icon,
  badgeText = null,
  actions = null,
  footer = null,
  loading = false,
  heightClass = 'min-h-[340px]',
  children,
}) => {
  if (loading) {
    return (
      <div className="bull-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,255,0.16)]">
          <div className="space-y-1.5">
            <div className="h-4 w-44 bg-[#151F36] rounded animate-pulse" />
            <div className="h-3 w-64 bg-[#151F36]/70 rounded animate-pulse" />
          </div>
          <div className="h-8 w-36 bg-[#151F36] rounded-xl animate-pulse" />
        </div>
        <div className={`${heightClass} w-full bg-[#10182B]/70 rounded-xl animate-pulse flex items-center justify-center text-xs font-mono text-[#7B8AA8]`}>
          Loading visualization...
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="bull-card p-5 sm:p-6 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-[#38D9F5] shrink-0" />}
            <h3 className="text-sm font-bold font-display text-[#F8FAFF] tracking-tight truncate">
              {title}
            </h3>
            {badgeText && (
              <span className="text-[10px] font-mono font-semibold text-[#31E981] bg-[#31E981]/12 border border-[#31E981]/25 px-2 py-0.5 rounded-md whitespace-nowrap">
                {badgeText}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#7B8AA8] leading-snug">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>

      <div className={`w-full ${heightClass}`}>
        {children}
      </div>

      {footer && (
        <div className="pt-3 border-t border-[rgba(125,160,255,0.12)] text-[11px] text-[#7B8AA8] flex flex-wrap items-center justify-between gap-2">
          {footer}
        </div>
      )}
    </motion.div>
  );
};
