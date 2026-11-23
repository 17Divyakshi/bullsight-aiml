import React, { useState, useEffect, useCallback, useRef } from 'react';
import { stockAPI } from '../services/api';
import { formatAssetPrice, formatTimestamp } from '../utils/formatters';
import { Server, Database, Cpu, Activity, FolderCheck, RefreshCw, ChevronDown } from 'lucide-react';

export const BackendStatusPanel = ({ compact = false }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await stockAPI.getSystemStatus();
      setStatus(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!compact) return undefined;
    const onDocClick = e => {
      if (popRef.current && !popRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [compact]);

  const expressOnline = Boolean(status?.express_api?.online);
  const marketOnline = Boolean(status?.market_feed?.online);
  const mlOnline = Boolean(status?.fastapi_ml?.online);
  const readyCount = status?.artifacts?.ready_count ?? 0;
  const totalSupported = status?.artifacts?.total_supported ?? 5;

  const overallLabel = loading
    ? 'Checking...'
    : !expressOnline
      ? 'Backend Offline'
      : mlOnline && marketOnline
        ? 'All Systems Online'
        : marketOnline
          ? 'API & Market Live'
          : 'Degraded Connection';

  const badgeTone = loading
    ? 'text-[#38D9F5] border-[#38D9F5]/30 bg-[#38D9F5]/10'
    : !expressOnline
      ? 'text-[#FF586A] border-[#FF586A]/35 bg-[#FF586A]/10'
      : mlOnline && marketOnline
        ? 'text-[#31E981] border-[#31E981]/35 bg-[#31E981]/10'
        : 'text-[#38D9F5] border-[#38D9F5]/35 bg-[#38D9F5]/10';

  const items = [
    {
      label: 'Express API Server',
      icon: Server,
      online: expressOnline,
      detail: expressOnline
        ? `Online · Uptime ${status?.express_api?.uptime_seconds ?? 0}s`
        : 'Offline / Unreachable',
    },
    {
      label: 'Market Data Feed',
      icon: Activity,
      online: marketOnline,
      detail: marketOnline
        ? `Online (${status?.market_feed?.latency_ms ?? '-'}ms) · ^NSEI ${formatAssetPrice(status?.market_feed?.last_observed_price, '^NSEI')}`
        : 'Yahoo Finance feed unavailable',
    },
    {
      label: 'FastAPI ML Service',
      icon: Cpu,
      online: mlOnline,
      detail: mlOnline
        ? `Online (${status?.fastapi_ml?.latency_ms ?? '-'}ms)`
        : 'Offline (Start FastAPI microservice for ML inference)',
    },
    {
      label: 'Trained Model Artifacts',
      icon: FolderCheck,
      online: readyCount > 0,
      detail: `${readyCount}/${totalSupported} models · Eval CSV: ${status?.artifacts?.evaluation_csv_available ? 'Yes' : 'No'} · BT CSV: ${status?.artifacts?.backtesting_csv_available ? 'Yes' : 'No'}`,
    },
    {
      label: 'Persistence Store',
      icon: Database,
      online: Boolean(status?.express_api?.online),
      detail: status?.database?.connected ? 'MongoDB Connected' : status?.database?.mode || 'In-Memory Fallback',
    },
  ];

  if (compact) {
    return (
      <div ref={popRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-all whitespace-nowrap ${badgeTone}`}
          title="Inspect Live Backend Connection Status"
        >
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              !expressOnline ? 'bg-[#FF586A]' : mlOnline ? 'bg-[#31E981]' : 'bg-[#38D9F5]'
            }`}
          />
          <span className="hidden sm:inline">{overallLabel}</span>
          <span className="sm:hidden">Status</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#10182B] border border-[rgba(125,160,255,0.26)] shadow-cardHover p-4 z-50 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(125,160,255,0.16)]">
              <div>
                <h4 className="text-xs font-bold font-display text-[#F8FAFF]">
                  Live Backend Connection Status
                </h4>
                <p className="text-[10px] font-mono text-[#7B8AA8]">
                  Checked {status?.checked_at ? formatTimestamp(status.checked_at) : 'now'}
                </p>
              </div>
              <button
                type="button"
                onClick={checkStatus}
                disabled={loading}
                className="p-1.5 rounded-lg bg-[#070B1A] border border-[rgba(125,160,255,0.2)] text-[#38D9F5] hover:border-[#31E981]/45 transition-all"
                title="Re-check Services"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="p-2.5 rounded-xl bg-[#070B1A]/80 border border-[rgba(125,160,255,0.14)] flex items-start justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${item.online ? 'text-[#31E981]' : 'text-[#FF586A]'}`} />
                      <div className="min-w-0">
                        <div className="font-semibold text-[#F8FAFF] text-[11px]">{item.label}</div>
                        <div className="text-[10px] font-mono text-[#AAB7D0] truncate">{item.detail}</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold shrink-0 ${
                        item.online ? 'text-[#31E981]' : 'text-[#FF586A]'
                      }`}
                    >
                      {item.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bull-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-[#38D9F5]" />
            <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
              Live Backend Connection Status
            </h3>
            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${badgeTone}`}>
              {overallLabel}
            </span>
          </div>
          <p className="text-xs text-[#7B8AA8] font-mono">
            Real-time health telemetry for Express API, Yahoo Finance Market Feed, FastAPI ML Engine, and Model Artifacts
          </p>
        </div>

        <button
          type="button"
          onClick={checkStatus}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.22)] hover:border-[#31E981]/45 text-xs font-mono font-bold text-[#38D9F5] flex items-center space-x-1.5 transition-all self-start sm:self-auto whitespace-nowrap"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Checking...' : 'Re-check Connections'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-4 rounded-xl bg-[#070B1A]/75 border border-[rgba(125,160,255,0.16)] space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2">
                <Icon className={`w-4 h-4 ${item.online ? 'text-[#31E981]' : 'text-[#FF586A]'}`} />
                <span
                  className={`text-[10px] font-mono font-bold ${
                    item.online ? 'text-[#31E981]' : 'text-[#FF586A]'
                  }`}
                >
                  {item.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#F8FAFF] font-display">{item.label}</div>
                <div className="text-[11px] font-mono text-[#AAB7D0] leading-snug break-words">
                  {item.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
