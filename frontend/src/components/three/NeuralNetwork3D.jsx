import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WebGLGuard, useWebGLCapabilities } from './WebGLGuard';

const LAYER_CONFIG = [
  { x: -2.4, count: 4, color: '#38D9F5', label: 'Market Inputs' },
  { x: -0.8, count: 6, color: '#4D8DFF', label: 'Feature Extraction' },
  { x: 0.8, count: 6, color: '#9065FF', label: 'Pattern Encoding' },
  { x: 2.4, count: 3, color: '#31E981', label: 'Directional Output' },
];

function NetworkGraph({ reducedMotion = false, onHoverNode }) {
  const groupRef = useRef();
  const pulsesRef = useRef();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { nodes, edges, linePositions } = useMemo(() => {
    const nodeList = [];
    const layerStart = [];
    LAYER_CONFIG.forEach((layer, lIdx) => {
      const indices = [];
      for (let i = 0; i < layer.count; i++) {
        const y = (i - (layer.count - 1) / 2) * 0.62;
        const z = Math.sin(i * 1.3 + lIdx) * 0.42;
        indices.push(nodeList.length);
        nodeList.push({
          id: nodeList.length,
          layer: lIdx,
          layerLabel: layer.label,
          pos: new THREE.Vector3(layer.x, y, z),
          color: layer.color,
        });
      }
      layerStart.push(indices);
    });

    const edgeList = [];
    const positions = [];
    for (let l = 0; l < layerStart.length - 1; l++) {
      for (const aIdx of layerStart[l]) {
        for (const bIdx of layerStart[l + 1]) {
          // Sparse clean topology for visual clarity
          if ((aIdx + bIdx) % 2 === 0 || (aIdx * 3 + bIdx) % 5 === 0) {
            const a = nodeList[aIdx].pos;
            const b = nodeList[bIdx].pos;
            edgeList.push({ a, b, speed: 0.35 + ((aIdx + bIdx) % 4) * 0.12, offset: (aIdx + bIdx) * 0.17 });
            positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
          }
        }
      }
    }

    return {
      nodes: nodeList,
      edges: edgeList,
      linePositions: new Float32Array(positions),
    };
  }, []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = Math.sin(t * 0.25) * 0.18;
    }
    if (pulsesRef.current) {
      edges.forEach((edge, i) => {
        const progress = reducedMotion ? 0.5 : (t * edge.speed + edge.offset) % 1;
        dummy.position.lerpVectors(edge.a, edge.b, progress);
        dummy.scale.setScalar(0.045);
        dummy.updateMatrix();
        pulsesRef.current.setMatrixAt(i, dummy.matrix);
      });
      pulsesRef.current.instanceMatrix.needsUpdate = true;
    }
    void dt;
  });

  return (
    <group ref={groupRef}>
      {/* Synaptic Connection Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#4D8DFF" transparent opacity={0.32} />
      </lineSegments>

      {/* Animated Traveling Signal Pulses */}
      <instancedMesh ref={pulsesRef} args={[undefined, undefined, edges.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#31E981" />
      </instancedMesh>

      {/* Glowing Layer Nodes */}
      {nodes.map(node => {
        const isHot = hoveredIdx === node.id;
        return (
          <mesh
            key={node.id}
            position={node.pos}
            scale={isHot ? 1.45 : 1}
            onPointerOver={e => {
              e.stopPropagation();
              setHoveredIdx(node.id);
              onHoverNode?.(node);
            }}
            onPointerOut={() => {
              setHoveredIdx(null);
              onHoverNode?.(null);
            }}
          >
            <sphereGeometry args={[0.125, 18, 18]} />
            <meshStandardMaterial
              color={node.color}
              emissive={node.color}
              emissiveIntensity={isHot ? 1.4 : 0.7}
              metalness={0.35}
              roughness={0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export const NeuralNetwork3D = () => {
  const { isSoftwareRenderer, reducedMotion } = useWebGLCapabilities();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [contextLost, setContextLost] = useState(false);

  return (
    <WebGLGuard
      fallbackTitle="Conceptual AI Processing Visualization"
      fallbackSubtitle="Interactive 3D network view requires WebGL. Core ML model architecture details remain available in Model Performance."
      heightClass="h-[360px]"
    >
      <div className="relative w-full h-[360px] rounded-2xl overflow-hidden bg-[#070B1A] border border-[rgba(125,160,255,0.2)]">
        {/* Mandatory Conceptual Visualization Header */}
        <div className="pointer-events-none absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#0B1226]/95 border border-[#9065FF]/35">
            <span className="text-[11px] font-mono font-bold text-[#38D9F5]">
              Conceptual AI Processing Visualization
            </span>
          </div>
          {hoveredNode && (
            <div className="px-3 py-1.5 rounded-xl bg-[#0B1226]/95 border border-[#31E981]/35 text-[11px] font-mono text-[#F8FAFF]">
              Stage: <span className="text-[#31E981] font-bold">{hoveredNode.layerLabel}</span>
            </div>
          )}
        </div>

        {contextLost ? (
          <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#AAB7D0]">
            Conceptual AI visualization paused while WebGL resets.
          </div>
        ) : (
          <Canvas
            dpr={isSoftwareRenderer ? 1 : [1, 1.75]}
            camera={{ position: [0, 0.4, 5.4], fov: 44, near: 0.1, far: 30 }}
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
            <ambientLight intensity={0.55} color="#A6C4FF" />
            <pointLight position={[3, 3, 3]} intensity={2.0} color="#38D9F5" />
            <pointLight position={[-3, -2, 3]} intensity={1.8} color="#9065FF" />

            <NetworkGraph reducedMotion={reducedMotion} onHoverNode={setHoveredNode} />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        )}

        <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-[#7B8AA8]">
          <span>Drag to rotate · Hover nodes to inspect signal stages</span>
          <span className="text-[#AAB7D0]">
            Conceptual illustration only — does not depict exact weights of LR, RF, or LSTM.
          </span>
        </div>
      </div>
    </WebGLGuard>
  );
};

export default NeuralNetwork3D;
