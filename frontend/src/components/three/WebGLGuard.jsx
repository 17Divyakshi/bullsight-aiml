import React, { Component, useState, useEffect } from 'react';
import { Layers } from 'lucide-react';

export function detectWebGLCapabilities() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { supported: false, isSoftwareRenderer: true, reducedMotion: false };
  }

  const reducedMotion = Boolean(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'high-performance' }) ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) {
      return { supported: false, isSoftwareRenderer: true, reducedMotion };
    }

    let renderer = '';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
    } else {
      renderer = String(gl.getParameter(gl.RENDERER) || '');
    }

    const isSoftwareRenderer = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer);

    const loseExt = gl.getExtension('WEBGL_lose_context');
    if (loseExt) {
      // keep clean; do not force lose
    }

    return { supported: true, isSoftwareRenderer, reducedMotion };
  } catch {
    return { supported: false, isSoftwareRenderer: true, reducedMotion };
  }
}

export function useWebGLCapabilities() {
  const [caps, setCaps] = useState(() => detectWebGLCapabilities());

  useEffect(() => {
    setCaps(detectWebGLCapabilities());
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const onChange = () => setCaps(detectWebGLCapabilities());
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return caps;
}

class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err) {
    console.warn('[BULLSIGHT 3D] Falling back from WebGL boundary:', err?.message || err);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const WebGLFallbackCard = ({
  title = 'Interactive 3D Terminal View',
  subtitle = 'Hardware WebGL rendering is unavailable on this browser session. Core analytics and 2D charts remain fully active.',
  heightClass = 'h-[420px]',
}) => (
  <div
    className={`w-full ${heightClass} rounded-2xl bg-gradient-to-br from-[#10182B] via-[#151F36] to-[#070B1A] border border-[rgba(125,160,255,0.22)] flex flex-col items-center justify-center p-8 text-center space-y-3`}
  >
    <div className="w-12 h-12 rounded-2xl bg-[#4D8DFF]/15 border border-[#38D9F5]/30 text-[#38D9F5] flex items-center justify-center">
      <Layers className="w-6 h-6" />
    </div>
    <h3 className="text-sm font-bold font-display text-[#F8FAFF]">{title}</h3>
    <p className="text-xs text-[#AAB7D0] max-w-sm leading-relaxed">{subtitle}</p>
  </div>
);

export const WebGLGuard = ({
  children,
  fallbackTitle,
  fallbackSubtitle,
  heightClass = 'h-[420px]',
}) => {
  const { supported } = useWebGLCapabilities();

  const fallback = (
    <WebGLFallbackCard
      title={fallbackTitle}
      subtitle={fallbackSubtitle}
      heightClass={heightClass}
    />
  );

  if (!supported) {
    return fallback;
  }

  return <WebGLErrorBoundary fallback={fallback}>{children}</WebGLErrorBoundary>;
};
