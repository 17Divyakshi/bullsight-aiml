import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { WebGLGuard, useWebGLCapabilities } from './WebGLGuard';
import { formatAssetPrice, formatSignedPercent } from '../../utils/formatters';

function BullSculpture({ position = [-1.45, 0, 0.72], reducedMotion = false }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const hornCurveLeft = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.08, 0.2, 0.12),
        new THREE.Vector3(0.24, 0.36, 0.28),
        new THREE.Vector3(0.42, 0.56, 0.2),
      ]),
    []
  );
  const hornCurveRight = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.08, 0.2, -0.12),
        new THREE.Vector3(0.24, 0.36, -0.28),
        new THREE.Vector3(0.42, 0.56, -0.2),
      ]),
    []
  );

  useFrame((state, rawDelta) => {
    if (!groupRef.current) return;
    const dt = Math.min(rawDelta, 0.05);
    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 1.4) * 0.035;
      const targetScale = hovered ? 1.055 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.exp(-8 * dt));
    }
  });

  const bodyMatProps = {
    color: hovered ? '#46F594' : '#31E981',
    metalness: 0.78,
    roughness: 0.22,
    emissive: '#107D42',
    emissiveIntensity: hovered ? 0.55 : 0.28,
  };

  const accentMatProps = {
    color: '#A7FFE0',
    metalness: 0.9,
    roughness: 0.14,
    emissive: '#31E981',
    emissiveIntensity: hovered ? 0.65 : 0.32,
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, 0.48, 0]}
      onPointerOver={e => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Glowing circular bull plinth */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.1, 32]} />
        <meshStandardMaterial color="#0F1C36" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.74, 0.82, 48]} />
        <meshBasicMaterial color="#31E981" transparent opacity={hovered ? 0.95 : 0.65} />
      </mesh>

      {/* Barrel torso */}
      <mesh position={[-0.08, 0.78, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.31, 0.62, 12, 24]} />
        <meshStandardMaterial {...bodyMatProps} />
      </mesh>
      {/* Muscular shoulder hump */}
      <mesh position={[0.25, 0.9, 0]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial {...bodyMatProps} />
      </mesh>
      {/* Neck & charging head */}
      <group position={[0.56, 0.98, 0]} rotation={[0, 0, -0.22]}>
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.24, 0.42, 20]} />
          <meshStandardMaterial {...bodyMatProps} />
        </mesh>
        <mesh position={[0.18, -0.04, 0]}>
          <boxGeometry args={[0.34, 0.25, 0.26]} />
          <meshStandardMaterial {...bodyMatProps} />
        </mesh>
        {/* Snout */}
        <mesh position={[0.36, -0.07, 0]}>
          <boxGeometry args={[0.16, 0.17, 0.18]} />
          <meshStandardMaterial {...accentMatProps} />
        </mesh>
        {/* Swept metallic horns */}
        <mesh>
          <tubeGeometry args={[hornCurveLeft, 18, 0.042, 10, false]} />
          <meshStandardMaterial {...accentMatProps} />
        </mesh>
        <mesh>
          <tubeGeometry args={[hornCurveRight, 18, 0.042, 10, false]} />
          <meshStandardMaterial {...accentMatProps} />
        </mesh>
      </group>

      {/* 4 grounded legs */}
      {[
        [0.26, 0.36, 0.19],
        [0.26, 0.36, -0.19],
        [-0.36, 0.36, 0.18],
        [-0.36, 0.36, -0.18],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <cylinderGeometry args={[0.075, 0.06, 0.56, 12]} />
          <meshStandardMaterial {...bodyMatProps} />
        </mesh>
      ))}

      {/* Tail */}
      <mesh position={[-0.58, 0.72, 0]} rotation={[0, 0, 0.65]}>
        <cylinderGeometry args={[0.028, 0.018, 0.44, 8]} />
        <meshStandardMaterial {...accentMatProps} />
      </mesh>
    </group>
  );
}

function BearSculpture({ position = [1.48, 0, 0.72], reducedMotion = false }) {
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, rawDelta) => {
    if (!groupRef.current) return;
    const dt = Math.min(rawDelta, 0.05);
    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 1.4 + Math.PI) * 0.03;
      const targetScale = hovered ? 1.055 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 1 - Math.exp(-8 * dt));
    }
  });

  const bearMatProps = {
    color: hovered ? '#FF7585' : '#FF586A',
    metalness: 0.7,
    roughness: 0.26,
    emissive: '#8A1C2E',
    emissiveIntensity: hovered ? 0.5 : 0.24,
  };

  const muzzleMatProps = {
    color: '#FFA8B2',
    metalness: 0.6,
    roughness: 0.3,
  };

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={[0, -0.48, 0]}
      onPointerOver={e => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Bear plinth */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.85, 0.95, 0.1, 32]} />
        <meshStandardMaterial color="#1A1128" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.74, 0.82, 48]} />
        <meshBasicMaterial color="#FF586A" transparent opacity={hovered ? 0.95 : 0.6} />
      </mesh>

      {/* Heavy crouched torso */}
      <mesh position={[0.08, 0.74, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.35, 0.62, 12, 24]} />
        <meshStandardMaterial {...bearMatProps} />
      </mesh>
      {/* Broad shoulder hump */}
      <mesh position={[-0.22, 0.88, 0]}>
        <sphereGeometry args={[0.36, 24, 24]} />
        <meshStandardMaterial {...bearMatProps} />
      </mesh>

      {/* Head, snout & rounded ears facing left-forward */}
      <group position={[-0.56, 0.86, 0]} rotation={[0, 0, 0.18]}>
        <mesh>
          <sphereGeometry args={[0.25, 22, 22]} />
          <meshStandardMaterial {...bearMatProps} />
        </mesh>
        <mesh position={[-0.24, -0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.15, 0.22, 16]} />
          <meshStandardMaterial {...muzzleMatProps} />
        </mesh>
        <mesh position={[0.02, 0.22, 0.16]}>
          <sphereGeometry args={[0.075, 14, 14]} />
          <meshStandardMaterial {...bearMatProps} />
        </mesh>
        <mesh position={[0.02, 0.22, -0.16]}>
          <sphereGeometry args={[0.075, 14, 14]} />
          <meshStandardMaterial {...bearMatProps} />
        </mesh>
      </group>

      {/* 4 sturdy limbs */}
      {[
        [-0.26, 0.34, 0.22],
        [-0.26, 0.34, -0.22],
        [0.36, 0.34, 0.21],
        [0.36, 0.34, -0.21],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <cylinderGeometry args={[0.095, 0.08, 0.52, 12]} />
          <meshStandardMaterial {...bearMatProps} />
        </mesh>
      ))}
    </group>
  );
}

function HolographicDisplay({ reducedMotion = false }) {
  const displayRef = useRef();
  const candleGroupRef = useRef();
  const [hovered, setHovered] = useState(false);

  const candles = useMemo(
    () => [
      { x: -1.4, low: -0.65, high: -0.12, open: -0.52, close: -0.25 },
      { x: -1.05, low: -0.45, high: 0.05, open: -0.24, close: -0.35 },
      { x: -0.7, low: -0.32, high: 0.28, open: -0.22, close: 0.14 },
      { x: -0.35, low: 0.02, high: 0.48, open: 0.12, close: 0.35 },
      { x: 0.0, low: 0.12, high: 0.55, open: 0.36, close: 0.22 },
      { x: 0.35, low: 0.18, high: 0.72, open: 0.24, close: 0.62 },
      { x: 0.7, low: 0.44, high: 0.94, open: 0.58, close: 0.85 },
      { x: 1.05, low: 0.68, high: 1.12, open: 0.82, close: 1.04 },
      { x: 1.4, low: 0.88, high: 1.32, open: 0.98, close: 1.24 },
    ],
    []
  );

  const trendTubeGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.45, -0.42, 0.12),
      new THREE.Vector3(-0.75, 0.05, 0.12),
      new THREE.Vector3(0.0, 0.28, 0.12),
      new THREE.Vector3(0.7, 0.78, 0.12),
      new THREE.Vector3(1.45, 1.22, 0.12),
    ]);
    return new THREE.TubeGeometry(curve, 36, 0.028, 10, false);
  }, []);

  useFrame((state, rawDelta) => {
    if (!displayRef.current || reducedMotion) return;
    const t = state.clock.elapsedTime;
    displayRef.current.position.y = 1.95 + Math.sin(t * 0.9) * 0.04;
    const dt = Math.min(rawDelta, 0.05);
    displayRef.current.rotation.y = THREE.MathUtils.lerp(
      displayRef.current.rotation.y,
      hovered ? 0.04 : 0,
      1 - Math.exp(-6 * dt)
    );
    if (candleGroupRef.current) {
      candleGroupRef.current.children.forEach((child, idx) => {
        if (idx < candles.length) {
          child.scale.y = 1 + Math.sin(t * 2.1 + idx * 0.65) * 0.045;
        }
      });
    }
  });

  return (
    <group
      ref={displayRef}
      position={[0, 1.95, -0.95]}
      onPointerOver={e => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Translucent holographic glass frame */}
      <mesh>
        <boxGeometry args={[3.9, 2.35, 0.06]} />
        <meshPhysicalMaterial
          color="#0F1B38"
          transparent
          opacity={0.42}
          roughness={0.18}
          metalness={0.35}
          transmission={0.2}
        />
      </mesh>
      {/* Wireframe cyan rim */}
      <mesh>
        <boxGeometry args={[3.94, 2.39, 0.065]} />
        <meshBasicMaterial color="#38D9F5" wireframe transparent opacity={hovered ? 0.58 : 0.32} />
      </mesh>

      {/* Subtle holographic price-level grid lines */}
      {[-0.65, -0.2, 0.25, 0.7].map((yPos, i) => (
        <mesh key={i} position={[0, yPos, 0.04]}>
          <boxGeometry args={[3.55, 0.008, 0.005]} />
          <meshBasicMaterial color="#4D8DFF" transparent opacity={0.24} />
        </mesh>
      ))}

      {/* Animated 3D Candlestick bars inside hologram */}
      <group ref={candleGroupRef} position={[0, -0.28, 0.09]}>
        {candles.map((c, idx) => {
          const isBull = c.close >= c.open;
          const color = isBull ? '#31E981' : '#FF586A';
          const bodyHeight = Math.max(0.08, Math.abs(c.close - c.open));
          const bodyCenter = (c.close + c.open) / 2;
          const wickHeight = Math.max(0.14, c.high - c.low);
          const wickCenter = (c.high + c.low) / 2;
          return (
            <group key={idx} position={[c.x, 0, 0]}>
              <mesh position={[0, wickCenter, 0]}>
                <cylinderGeometry args={[0.015, 0.015, wickHeight, 8]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
              </mesh>
              <mesh position={[0, bodyCenter, 0]}>
                <boxGeometry args={[0.16, bodyHeight, 0.16]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={hovered ? 0.78 : 0.5}
                  metalness={0.5}
                  roughness={0.25}
                />
              </mesh>
            </group>
          );
        })}

        {/* Glowing upward neon-green trend line */}
        <mesh geometry={trendTubeGeo}>
          <meshStandardMaterial
            color="#31E981"
            emissive="#31E981"
            emissiveIntensity={1.2}
            metalness={0.3}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[1.45, 1.22, 0.12]}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#38D9F5" emissive="#31E981" emissiveIntensity={1.5} />
        </mesh>
      </group>
    </group>
  );
}

function AmbientParticles({ count = 90, reducedMotion = false }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: ((Math.sin(i * 17.3) + 1) * 0.5 - 0.5) * 9.5,
        y: ((Math.cos(i * 9.1) + 1) * 0.5) * 4.5 - 0.2,
        z: ((Math.sin(i * 23.7) + 1) * 0.5 - 0.5) * 6.5 - 0.5,
        speed: 0.25 + (i % 7) * 0.07,
        scale: 0.022 + (i % 4) * 0.009,
        phase: i * 0.65,
      })),
    [count]
  );

  useFrame(state => {
    if (!meshRef.current) return;
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      dummy.position.set(
        s.x + Math.sin(t * s.speed + s.phase) * 0.24,
        s.y + Math.cos(t * s.speed * 0.8 + s.phase) * 0.18,
        s.z
      );
      dummy.scale.setScalar(s.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#38D9F5" transparent opacity={0.62} />
    </instancedMesh>
  );
}

function TerminalBase({ reducedMotion = false }) {
  const outerRingRef = useRef();
  useFrame((_, rawDelta) => {
    if (!outerRingRef.current || reducedMotion) return;
    outerRingRef.current.rotation.z += Math.min(rawDelta, 0.05) * 0.22;
  });

  return (
    <group position={[0, -0.04, 0.05]}>
      {/* Main futuristic financial data terminal deck */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[3.35, 3.65, 0.16, 48]} />
        <meshStandardMaterial color="#0D162C" metalness={0.82} roughness={0.28} />
      </mesh>
      <mesh ref={outerRingRef} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.22, 3.31, 48]} />
        <meshBasicMaterial color="#4D8DFF" transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.15, 2.21, 64]} />
        <meshBasicMaterial color="#9065FF" transparent opacity={0.38} />
      </mesh>
    </group>
  );
}

function CameraRig({ pointerRef, reducedMotion }) {
  useFrame((state, rawDelta) => {
    if (reducedMotion) return;
    const dt = Math.min(rawDelta, 0.05);
    const px = pointerRef.current?.x ?? 0;
    const py = pointerRef.current?.y ?? 0;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, px * 0.55, 1 - Math.exp(-3.5 * dt));
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 2.05 + py * 0.3, 1 - Math.exp(-3.5 * dt));
  });
  return null;
}

export const HeroScene3D = ({ heroPreview = null }) => {
  const { isSoftwareRenderer, reducedMotion } = useWebGLCapabilities();
  const pointerRef = useRef({ x: 0, y: 0 });
  const [contextLost, setContextLost] = useState(false);

  const previewSymbol = heroPreview?.symbol || '^NSEI';
  const previewPrice =
    heroPreview?.price != null ? formatAssetPrice(heroPreview.price, previewSymbol) : null;
  const previewPred = heroPreview?.prediction;
  const hasVerifiedPred = Boolean(
    previewPred?.ml_verified && previewPred?.predicted_next_close != null
  );

  return (
    <WebGLGuard
      fallbackTitle="BULLSIGHT 3D Financial Engine"
      fallbackSubtitle="WebGL 3D view is unavailable in this browser. Explore live market charts, predictions, and model benchmarks from the dashboard."
      heightClass="h-[430px] sm:h-[500px] lg:h-[540px]"
    >
      <div
        className="relative w-full h-[430px] sm:h-[500px] lg:h-[540px] rounded-3xl overflow-hidden border border-[rgba(125,160,255,0.22)] bg-[radial-gradient(circle_at_50%_38%,rgba(77,141,255,0.22),rgba(16,24,43,0.92)_68%,#070B1A_100%)]"
        onPointerMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          pointerRef.current = {
            x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
            y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
          };
        }}
        onPointerLeave={() => {
          pointerRef.current = { x: 0, y: 0 };
        }}
      >
        {contextLost ? (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#AAB7D0] p-6 text-center">
            3D WebGL context paused — reloading graphics surface...
          </div>
        ) : (
          <Canvas
            dpr={isSoftwareRenderer ? 1 : [1, 1.75]}
            camera={{ position: [0, 2.05, 6.25], fov: 42, near: 0.1, far: 50 }}
            gl={{ antialias: !isSoftwareRenderer, alpha: true, powerPreference: 'high-performance' }}
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener('webglcontextlost', e => {
                e.preventDefault();
                setContextLost(true);
              });
              canvas.addEventListener('webglcontextrestored', () => {
                setContextLost(false);
              });
            }}
          >
            <fog attach="fog" args={['#070B1A', 8, 19]} />
            <ambientLight intensity={0.45} color="#A6C4FF" />
            <directionalLight position={[4, 6, 5]} intensity={1.8} color="#38D9F5" />
            <directionalLight position={[-4.5, 4, 3]} intensity={1.6} color="#31E981" />
            <pointLight position={[0, 3.2, 1.5]} intensity={2.2} distance={10} color="#9065FF" />
            <pointLight position={[2.2, 1.2, 2.5]} intensity={1.5} distance={7} color="#FF586A" />

            {/* Procedural HDR Studio Reflections (zero external network fetches) */}
            <Environment resolution={256}>
              <Lightformer intensity={2.2} color="#38D9F5" position={[0, 5, -4]} scale={[10, 4, 1]} />
              <Lightformer intensity={1.8} color="#31E981" position={[-6, 2, 2]} scale={[6, 3, 1]} />
              <Lightformer intensity={1.6} color="#9065FF" position={[6, 2, 2]} scale={[6, 3, 1]} />
              <Lightformer intensity={1.2} color="#4D8DFF" position={[0, -3, 3]} scale={[8, 4, 1]} />
            </Environment>

            <TerminalBase reducedMotion={reducedMotion} />
            <BullSculpture reducedMotion={reducedMotion} />
            <BearSculpture reducedMotion={reducedMotion} />
            <HolographicDisplay reducedMotion={reducedMotion} />
            <AmbientParticles count={isSoftwareRenderer ? 50 : 110} reducedMotion={reducedMotion} />
            <CameraRig pointerRef={pointerRef} reducedMotion={reducedMotion} />

            {/* Floating perimeter analytics cards inside 3D stage (opaque navy, no backdrop-blur) */}
            <Html position={[-2.48, 2.78, 0.2]} center distanceFactor={8} zIndexRange={[10, 0]}>
              <div className="pointer-events-none select-none w-44 rounded-xl bg-[#0B1226]/95 border border-[#31E981]/35 p-2.5 shadow-lg">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#31E981]">
                  {previewSymbol} · Market Snapshot
                </div>
                <div className="text-xs font-mono font-bold text-[#F8FAFF] tabular-nums mt-0.5">
                  {previewPrice || 'Yahoo Finance Feed'}
                </div>
                <div className="text-[10px] font-mono text-[#AAB7D0] mt-0.5">
                  {heroPreview?.changePercent != null
                    ? formatSignedPercent(heroPreview.changePercent)
                    : '14 Technical Features'}
                </div>
              </div>
            </Html>

            <Html position={[2.48, 2.6, 0.2]} center distanceFactor={8} zIndexRange={[10, 0]}>
              <div className="pointer-events-none select-none w-44 rounded-xl bg-[#0B1226]/95 border border-[#38D9F5]/35 p-2.5 shadow-lg">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#38D9F5]">
                  Next-Session AI Engine
                </div>
                <div className="text-xs font-mono font-bold text-[#F8FAFF] tabular-nums mt-0.5">
                  {hasVerifiedPred
                    ? formatAssetPrice(previewPred.predicted_next_close, previewSymbol)
                    : 'LR · RF · LSTM'}
                </div>
                <div className="text-[10px] font-mono text-[#AAB7D0] mt-0.5">
                  {hasVerifiedPred
                    ? `${previewPred.selected_model} · ${previewPred.signal}`
                    : 'Lowest Validation MAE'}
                </div>
              </div>
            </Html>

            <Html position={[0, 3.38, -0.75]} center distanceFactor={8.5} zIndexRange={[10, 0]}>
              <div className="pointer-events-none select-none rounded-lg bg-[#0B1226]/92 border border-[#4D8DFF]/35 px-3 py-1.5 shadow-md whitespace-nowrap">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#38D9F5]">
                  3D Holographic Order &amp; Trend Matrix
                </span>
              </div>
            </Html>



            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={0.6}
              enableDamping={true}
              dampingFactor={0.05}
              minPolarAngle={Math.PI / 4}
              maxPolarAngle={Math.PI / 2.02}
            />


          </Canvas>
        )}

        {/* Subtle interactive cue at bottom corner */}
        <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-[#7B8AA8]">
          <span>Interactive 3D Terminal · Drag to orbit</span>
          <span className="text-[#38D9F5]">WebGL Scene</span>
        </div>
      </div>
    </WebGLGuard>
  );
};

export default HeroScene3D;
