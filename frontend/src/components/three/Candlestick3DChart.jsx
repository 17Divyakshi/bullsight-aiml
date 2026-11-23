import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { WebGLGuard, useWebGLCapabilities } from './WebGLGuard';
import { UnavailableState } from '../UnavailableState';
import { formatAssetPrice, formatShortTick } from '../../utils/formatters';
import { RotateCcw } from 'lucide-react';

function CandleMesh({
  candle,
  xPos,
  width,
  yToWorld,
  isHovered,
  onHover,
  onLeave,
  reducedMotion,
  delayIndex,
}) {
  const groupRef = useRef();
  const [animDone, setAnimDone] = useState(reducedMotion);
  const startRef = useRef(null);

  const isBull = candle.close >= candle.open;
  const color = isBull ? '#31E981' : '#FF586A';

  const openY = yToWorld(candle.open);
  const closeY = yToWorld(candle.close);
  const highY = yToWorld(candle.high);
  const lowY = yToWorld(candle.low);

  const bodyHeight = Math.max(0.06, Math.abs(closeY - openY));
  const bodyCenterY = (openY + closeY) / 2;
  const wickHeight = Math.max(0.1, highY - lowY);
  const wickCenterY = (highY + lowY) / 2;

  useEffect(() => {
    startRef.current = null;
    setAnimDone(reducedMotion);
  }, [candle.date, reducedMotion]);

  useFrame(state => {
    if (!groupRef.current) return;
    if (reducedMotion || animDone) {
      groupRef.current.scale.y = 1;
      return;
    }
    if (startRef.current === null) {
      startRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startRef.current - delayIndex * 0.012;
    const progress = THREE.MathUtils.clamp(elapsed / 0.35, 0.01, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    groupRef.current.scale.y = eased;
    if (progress >= 1) setAnimDone(true);
  });

  return (
    <group
      ref={groupRef}
      position={[xPos, 0, 0]}
      onPointerOver={e => {
        e.stopPropagation();
        onHover(candle);
      }}
      onPointerOut={e => {
        e.stopPropagation();
        onLeave();
      }}
    >
      {/* High-Low Wick */}
      <mesh position={[0, wickCenterY, 0]}>
        <cylinderGeometry args={[width * 0.14, width * 0.14, wickHeight, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.9 : 0.35}
        />
      </mesh>
      {/* Open-Close 3D Body */}
      <mesh position={[0, bodyCenterY, 0]}>
        <boxGeometry args={[width, bodyHeight, width]} />
        <meshStandardMaterial
          color={isHovered ? '#F8FAFF' : color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.95 : 0.42}
          metalness={0.45}
          roughness={0.28}
        />
      </mesh>
    </group>
  );
}

export const Candlestick3DChart = ({
  history = [],
  symbol = '^NSEI',
  loading = false,
  onRetry,
}) => {
  const { isSoftwareRenderer, reducedMotion } = useWebGLCapabilities();
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [contextLost, setContextLost] = useState(false);
  const controlsRef = useRef();

  const candles = useMemo(() => {
    const raw = Array.isArray(history) ? history : [];
    const valid = raw.filter(
      d =>
        d &&
        d.date &&
        d.open != null &&
        d.high != null &&
        d.low != null &&
        d.close != null
    );
    return valid.slice(-40);
  }, [history]);

  const { minPrice, maxPrice, yTicks, width, spacing } = useMemo(() => {
    if (candles.length === 0) {
      return { minPrice: 0, maxPrice: 1, yTicks: [], width: 0.2, spacing: 0.3 };
    }
    let minP = Infinity;
    let maxP = -Infinity;
    for (const c of candles) {
      if (c.low < minP) minP = c.low;
      if (c.high > maxP) maxP = c.high;
    }
    if (minP === maxP) {
      minP *= 0.98;
      maxP *= 1.02;
    }
    const pad = (maxP - minP) * 0.08;
    const lo = minP - pad;
    const hi = maxP + pad;
    const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);

    const totalSpan = 8.4;
    const sp = totalSpan / Math.max(candles.length, 1);
    const w = Math.min(0.32, Math.max(0.11, sp * 0.56));
    return { minPrice: lo, maxPrice: hi, yTicks: ticks, width: w, spacing: sp };
  }, [candles]);

  const yToWorld = price => {
    const norm = (Number(price) - minPrice) / Math.max(maxPrice - minPrice, 1e-6);
    return norm * 3.6;
  };

  if (loading) {
    return (
      <div className="h-[410px] w-full rounded-2xl bg-[#10182B]/70 border border-[rgba(125,160,255,0.16)] animate-pulse flex items-center justify-center text-xs font-mono text-[#7B8AA8]">
        Building 3D candlestick geometry...
      </div>
    );
  }

  if (candles.length === 0) {
    return (
      <UnavailableState
        compact
        title="Live market data or AI prediction is currently unavailable."
        description={`No historical OHLC sessions were returned for ${symbol} to render the 3D candlestick chart.`}
        onRetry={onRetry}
      />
    );
  }

  const startX = -((candles.length - 1) * spacing) / 2;

  return (
    <WebGLGuard
      fallbackTitle="3D Candlestick Chart Unavailable"
      fallbackSubtitle="Hardware WebGL is unavailable in this browser session. Switch back to 2D Candles or Area view."
      heightClass="h-[410px]"
    >
      <div className="relative w-full h-[410px] rounded-2xl overflow-hidden bg-[#070B1A] border border-[rgba(125,160,255,0.2)]">
        {/* Top Bar Info & Reset */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-[#0B1226]/95 border border-[rgba(125,160,255,0.22)] text-[11px] font-mono text-[#AAB7D0] pointer-events-auto">
            {candles.length} Sessions · Drag to rotate · Scroll to zoom
          </div>
          <button
            type="button"
            onClick={() => controlsRef.current?.reset()}
            className="pointer-events-auto px-2.5 py-1.5 rounded-xl bg-[#0B1226]/95 border border-[rgba(125,160,255,0.22)] hover:border-[#38D9F5]/50 text-[11px] font-mono text-[#F8FAFF] inline-flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-[#38D9F5]" />
            <span>Reset View</span>
          </button>
        </div>

        {/* Hovered Candle HUD Tooltip */}
        {hoveredCandle && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-xl bg-[#0B1226]/95 border border-[#38D9F5]/40 p-3 text-[11px] font-mono space-y-1 shadow-lg">
            <div className="font-bold text-[#F8FAFF] border-b border-[rgba(125,160,255,0.16)] pb-1">
              {hoveredCandle.date}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 tabular-nums">
              <span className="text-[#7B8AA8]">Open:</span>
              <span className="text-[#F8FAFF]">{formatAssetPrice(hoveredCandle.open, symbol)}</span>
              <span className="text-[#7B8AA8]">High:</span>
              <span className="text-[#31E981]">{formatAssetPrice(hoveredCandle.high, symbol)}</span>
              <span className="text-[#7B8AA8]">Low:</span>
              <span className="text-[#FF586A]">{formatAssetPrice(hoveredCandle.low, symbol)}</span>
              <span className="text-[#7B8AA8]">Close:</span>
              <span className="font-bold text-[#38D9F5]">{formatAssetPrice(hoveredCandle.close, symbol)}</span>
            </div>
          </div>
        )}

        {contextLost ? (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#AAB7D0]">
            3D Candlestick WebGL context lost. Switch to 2D Candles or refresh.
          </div>
        ) : (
          <Canvas
            dpr={isSoftwareRenderer ? 1 : [1, 1.75]}
            camera={{ position: [0, 2.5, 7.6], fov: 44, near: 0.1, far: 45 }}
            gl={{ antialias: !isSoftwareRenderer, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener('webglcontextlost', e => {
                e.preventDefault();
                setContextLost(true);
              });
              canvas.addEventListener('webglcontextrestored', () => setContextLost(false));
            }}
          >
            <color attach="background" args={['#070B1A']} />
            <ambientLight intensity={0.65} color="#B4CDFF" />
            <directionalLight position={[5, 8, 6]} intensity={1.5} color="#38D9F5" />
            <directionalLight position={[-5, 4, 4]} intensity={1.1} color="#4D8DFF" />

            <group position={[0, -1.65, 0]}>
              {/* Floor base grid */}
              <gridHelper args={[10, 20, '#2B4278', '#152244']} position={[0, 0, 0]} />

              {/* Horizontal Y-axis reference lines & price labels */}
              {yTicks.map((tickVal, idx) => {
                const y = yToWorld(tickVal);
                return (
                  <group key={idx}>
                    <Line
                      points={[
                        [-4.6, y, -0.35],
                        [4.6, y, -0.35],
                      ]}
                      color="#243866"
                      lineWidth={1}
                    />
                    <Text
                      position={[-5.1, y, -0.3]}
                      fontSize={0.21}
                      color="#AAB7D0"
                      anchorX="right"
                      anchorY="middle"
                    >
                      {formatShortTick(tickVal, symbol)}
                    </Text>
                  </group>
                );
              })}

              {/* X-axis start, middle, end date markers */}
              {[0, Math.floor(candles.length / 2), candles.length - 1]
                .filter((idx, i, arr) => arr.indexOf(idx) === i && candles[idx])
                .map(idx => (
                  <Text
                    key={idx}
                    position={[startX + idx * spacing, -0.25, 0.55]}
                    fontSize={0.18}
                    color="#7B8AA8"
                    anchorX="center"
                  >
                    {candles[idx].date}
                  </Text>
                ))}

              {/* Real 3D Candlestick Geometries */}
              {candles.map((candle, idx) => (
                <CandleMesh
                  key={`${candle.date}-${idx}`}
                  candle={candle}
                  xPos={startX + idx * spacing}
                  width={width}
                  yToWorld={yToWorld}
                  isHovered={hoveredCandle?.date === candle.date}
                  onHover={setHoveredCandle}
                  onLeave={() => setHoveredCandle(null)}
                  reducedMotion={reducedMotion}
                  delayIndex={idx}
                />
              ))}
            </group>

            <OrbitControls
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              minDistance={4.2}
              maxDistance={13}
              maxPolarAngle={Math.PI / 2.02}
            />
          </Canvas>
        )}
      </div>
    </WebGLGuard>
  );
};

export default Candlestick3DChart;
