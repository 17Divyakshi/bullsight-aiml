import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { WebGLGuard, useWebGLCapabilities } from './WebGLGuard';
import { SUPPORTED_FIVE_STOCKS } from '../../data/stocks';
import { formatAssetPrice, formatSignedPercent } from '../../utils/formatters';
import { ArrowUpRight, Compass, RefreshCw } from 'lucide-react';

function MarketPillar({
  node,
  index,
  total,
  isSelected,
  onSelect,
  reducedMotion,
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Arrange 5 core assets in an inviting curved semicircle
  const angle = ((index / Math.max(1, total - 1)) - 0.5) * Math.PI * 0.72;
  const radius = 3.1;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius - 1.65;

  const pct = node?.changePercent != null ? Number(node.changePercent) : null;
  const hasPrice = node?.price != null;
  const isPos = pct != null ? pct >= 0 : true;
  const height = hasPrice ? Math.min(2.6, Math.max(0.85, 1.35 + (pct ?? 0) * 0.28)) : 1.0;

  const color = !hasPrice ? '#4D8DFF' : isPos ? '#31E981' : '#FF586A';

  useFrame((state, rawDelta) => {
    if (!meshRef.current) return;
    const dt = Math.min(rawDelta, 0.05);
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    const targetScale = isSelected || hovered ? 1.12 : 1.0;
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 1 - Math.exp(-8 * dt));
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, 1 - Math.exp(-8 * dt));
    meshRef.current.position.y = height / 2 + (reducedMotion ? 0 : Math.sin(t * 1.5 + index) * 0.03);
  });

  return (
    <group position={[x, 0, z]}>
      {/* Ground pedestal ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.52, 32]} />
        <meshBasicMaterial color={isSelected ? '#38D9F5' : color} transparent opacity={isSelected ? 0.95 : 0.45} />
      </mesh>

      {/* Interactive 3D asset pillar */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onClick={e => {
          e.stopPropagation();
          onSelect(node.symbol);
        }}
        onPointerOver={e => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <cylinderGeometry args={[0.3, 0.36, height, 20]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected || hovered ? 0.65 : 0.28}
          metalness={0.68}
          roughness={0.22}
        />
      </mesh>

      {/* Top holographic badge */}
      <Html position={[0, height + 0.45, 0]} center distanceFactor={8} zIndexRange={[10, 0]}>
        <button
          type="button"
          onClick={() => onSelect(node.symbol)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all whitespace-nowrap border ${
            isSelected
              ? 'bg-[#070B1A] text-[#31E981] border-[#31E981]'
              : 'bg-[#0B1226]/95 text-[#F8FAFF] border-[rgba(125,160,255,0.28)] hover:border-[#38D9F5]'
          }`}
        >
          {node.shortLabel}
          {pct != null && (
            <span className={`ml-1.5 ${isPos ? 'text-[#31E981]' : 'text-[#FF586A]'}`}>
              {formatSignedPercent(pct)}
            </span>
          )}
        </button>
      </Html>
    </group>
  );
}

export const MarketExplorer3D = ({
  items = [],
  selectedSymbol,
  onSelectSymbol,
  onRefresh,
  loading = false,
}) => {
  const { isSoftwareRenderer, reducedMotion } = useWebGLCapabilities();

  const mergedNodes = useMemo(() => {
    return SUPPORTED_FIVE_STOCKS.map(core => {
      const live = items.find(i => i.symbol === core.symbol);
      return {
        ...core,
        price: live?.latestClose ?? live?.price ?? null,
        changePercent: live?.changePercent ?? null,
        volume: live?.volume ?? null,
        signal: live?.mlVerified ? live.signal : null,
        predictedNext: live?.mlVerified ? live.predictedNext : null,
      };
    });
  }, [items]);

  const activeNode = mergedNodes.find(n => n.symbol === selectedSymbol) || mergedNodes[0];

  return (
    <div className="bull-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[rgba(125,160,255,0.16)]">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#31E981]" />
            <h3 className="text-sm sm:text-base font-bold font-display text-[#F8FAFF]">
              Interactive 3D Market Explorer
            </h3>
          </div>
          <p className="text-xs text-[#AAB7D0]">
            Click or orbit any spatial equity pillar to inspect observed NIFTY 50 &amp; NSE leaders in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-[#070B1A] border border-[rgba(125,160,255,0.22)] text-xs font-mono font-bold text-[#38D9F5] hover:border-[#31E981]/45 flex items-center space-x-1.5 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync 3D Nodes</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 3D Canvas */}
        <div className="lg:col-span-8">
          <WebGLGuard
            fallbackTitle="Interactive 3D Market Explorer"
            fallbackSubtitle="WebGL is unavailable in this environment. Use the adjacent market table or Dashboard to inspect equities."
            heightClass="h-[340px]"
          >
            <div className="relative h-[340px] w-full rounded-2xl overflow-hidden border border-[rgba(125,160,255,0.18)] bg-[radial-gradient(circle_at_50%_40%,rgba(56,217,245,0.16),#070B1A_80%)]">
              <Canvas
                dpr={isSoftwareRenderer ? 1 : [1, 1.5]}
                camera={{ position: [0, 3.1, 5.2], fov: 42, near: 0.1, far: 40 }}
                gl={{ antialias: !isSoftwareRenderer, alpha: true }}
              >
                <ambientLight intensity={0.48} color="#B8D4FF" />
                <directionalLight position={[4, 6, 4]} intensity={1.5} color="#38D9F5" />
                <directionalLight position={[-4, 5, 3]} intensity={1.3} color="#31E981" />
                <Environment resolution={128}>
                  <Lightformer intensity={1.8} color="#38D9F5" position={[0, 4, -3]} scale={[8, 3, 1]} />
                  <Lightformer intensity={1.4} color="#31E981" position={[-5, 2, 2]} scale={[5, 3, 1]} />
                </Environment>

                {/* Subtle Orbital Floor Grid */}
                <gridHelper args={[10, 14, '#38D9F5', '#151F36']} position={[0, 0, -0.5]} />

                {mergedNodes.map((node, idx) => (
                  <MarketPillar
                    key={node.symbol}
                    node={node}
                    index={idx}
                    total={mergedNodes.length}
                    isSelected={node.symbol === activeNode?.symbol}
                    onSelect={sym => onSelectSymbol?.(sym)}
                    reducedMotion={reducedMotion}
                  />
                ))}

                <OrbitControls
                  enableZoom={true}
                  minDistance={3.5}
                  maxDistance={9}
                  maxPolarAngle={Math.PI / 2.1}
                  minPolarAngle={Math.PI / 5}
                />
              </Canvas>

              <div className="pointer-events-none absolute bottom-2.5 left-3 right-3 flex justify-between text-[10px] font-mono text-[#7B8AA8]">
                <span>Click pillar to inspect · Drag to orbit · Scroll to zoom</span>
                <span className="text-[#38D9F5]">5 Core Assets</span>
              </div>
            </div>
          </WebGLGuard>
        </div>

        {/* Selected Node Inspector HUD */}
        <div className="lg:col-span-4 rounded-2xl bg-[#070B1A]/80 border border-[rgba(125,160,255,0.18)] p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[rgba(125,160,255,0.14)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#38D9F5] block">
                  Selected 3D Node
                </span>
                <h4 className="text-lg font-extrabold font-display text-[#F8FAFF]">
                  {activeNode?.symbol}
                </h4>
                <p className="text-xs text-[#AAB7D0]">{activeNode?.label}</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10182B] border border-[rgba(125,160,255,0.2)] text-[#AAB7D0]">
                {activeNode?.exchange}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#7B8AA8]">Observed Close</span>
                <span className="font-bold text-[#F8FAFF] tabular-nums">
                  {activeNode?.price != null
                    ? formatAssetPrice(activeNode.price, activeNode.symbol)
                    : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B8AA8]">Session Change</span>
                <span
                  className={`font-bold tabular-nums ${
                    activeNode?.changePercent == null
                      ? 'text-[#7B8AA8]'
                      : Number(activeNode.changePercent) >= 0
                        ? 'text-[#31E981]'
                        : 'text-[#FF586A]'
                  }`}
                >
                  {activeNode?.changePercent != null
                    ? formatSignedPercent(activeNode.changePercent)
                    : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7B8AA8]">Next-Session Forecast</span>
                <span className="font-bold text-[#31E981] tabular-nums">
                  {activeNode?.predictedNext != null
                    ? formatAssetPrice(activeNode.predictedNext, activeNode.symbol)
                    : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              to={`/dashboard?symbol=${encodeURIComponent(activeNode?.symbol || '^NSEI')}`}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#31E981] to-[#38D9F5] text-[#070B1A] text-xs font-extrabold text-center transition-all flex items-center justify-center gap-1"
            >
              <span>Dashboard</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={`/predictions?symbol=${encodeURIComponent(activeNode?.symbol || '^NSEI')}`}
              className="py-2.5 px-3 rounded-xl bg-[#10182B] border border-[rgba(125,160,255,0.25)] hover:border-[#38D9F5] text-[#F8FAFF] text-xs font-bold text-center transition-all"
            >
              AI Forecast
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketExplorer3D;
