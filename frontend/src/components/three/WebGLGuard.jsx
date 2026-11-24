
import React, { Component, useState, useEffect } from 'react';
import { Layers } from 'lucide-react';

let cachedCapabilities = null;

export function detectWebGLCapabilities() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      supported: false,
      isSoftwareRenderer: true,
      reducedMotion: false
    };
  }

  const reducedMotion = Boolean(
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  if (cachedCapabilities) {
    return { ...cachedCapabilities, reducedMotion };
  }

  let gl = null;

  try {
    const canvas = document.createElement('canvas');

    gl =
      canvas.getContext('webgl2', {
        powerPreference: 'high-performance'
      }) ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl) {
      return {
        supported: false,
        isSoftwareRenderer: true,
        reducedMotion
      };
    }

    const debugInfo = gl.getExtension(
      'WEBGL_debug_renderer_info'
    );

    const renderer = debugInfo
      ? String(
          gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
        )
      : String(gl.getParameter(gl.RENDERER) || '');

    const isSoftwareRenderer =
      /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer);

    cachedCapabilities = {
      supported: true,
      isSoftwareRenderer
    };

    return { ...cachedCapabilities, reducedMotion };

  } catch {
    return {
      supported: false,
      isSoftwareRenderer: true,
      reducedMotion
    };
  } finally {
    // Release only the temporary detection context.
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export function useWebGLCapabilities() {
  const [caps, setCaps] = useState(
    () => detectWebGLCapabilities()
  );

  useEffect(() => {
    const mq = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    );

    if (!mq) return;

    const onChange = () => {
      setCaps(prev => ({
        ...prev,
        reducedMotion: mq.matches
      }));
    };

    mq.addEventListener?.('change', onChange);

    return () => {
      mq.removeEventListener?.('change', onChange);
    };
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
    console.warn(
      '[BULLSIGHT 3D] WebGL error:',
      err?.message || err
    );
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
  subtitle = 'Hardware WebGL rendering is unavailable. Core analytics and 2D charts remain active.',
  heightClass = 'h-[420px]',
}) => (
  <div
    className={`w-full ${heightClass} rounded-2xl bg-gradient-to-br from-[#10182B] via-[#151F36] to-[#070B1A] border border-[rgba(125,160,255,0.22)] flex flex-col items-center justify-center p-8 text-center space-y-3`}
  >
    <div className="w-12 h-12 rounded-2xl bg-[#4D8DFF]/15 border border-[#38D9F5]/30 text-[#38D9F5] flex items-center justify-center">
      <Layers className="w-6 h-6" />
    </div>

    <h3 className="text-sm font-bold font-display text-[#F8FAFF]">
      {title}
    </h3>

    <p className="text-xs text-[#AAB7D0] max-w-sm leading-relaxed">
      {subtitle}
    </p>
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

  return (
    <WebGLErrorBoundary fallback={fallback}>
      {children}
    </WebGLErrorBoundary>
  );
};
