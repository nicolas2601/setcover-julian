'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { tokens } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

interface GeneticPopulationR3FProps {
  progress: number; // 0 → 1, driven by GSAP ScrollTrigger from parent
  className?: string;
}

interface PopulationProps {
  progress: number;
}

// GIC colors
const GC = {
  dotNormal:     tokens.color.actionAzure,      // #41a1cf
  dotBest:       tokens.color.cofounderBlue,    // #0081c0
  dotWorst:      '#6c9db5',                     // muted blue for worst fitness
  clusterMarker: tokens.color.cofounderBlue,
  ambientColor:  tokens.color.actionAzure,
  pointLight:    tokens.color.cofounderBlue,
  hudColor:      '#ffffff',
  convergenceWave: '#0081c0',
} as const;

// ─── LCG ─────────────────────────────────────────────────────────────────────

function lcgRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Three cluster centers ────────────────────────────────────────────────────

const CLUSTER_CENTERS: [number, number, number][] = [
  [-1.2, 0.5, 0.3],
  [1.1, -0.4, -0.2],
  [0.1, 0.8, -1.0],
];

// ─── Fitness-based population (150 instanced spheres) ────────────────────────

function Population({ progress }: PopulationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 150;

  const { initialPositions, clusterAssignments, fitness } = useMemo(() => {
    const rand = lcgRand(77);
    const initPos: THREE.Vector3[] = [];
    const clusterAss: number[] = [];
    const fitnessArr = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2;
      const phi = rand() * Math.PI;
      const r = 1.5 + rand() * 1.0;
      initPos.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.6,
          r * Math.cos(phi),
        ),
      );
      clusterAss.push(Math.floor(rand() * CLUSTER_CENTERS.length));
      // Fitness 0→1 (0 = worst, 1 = best elite)
      fitnessArr[i] = rand();
    }

    return { initialPositions: initPos, clusterAssignments: clusterAss, fitness: fitnessArr };
  }, []);

  const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const easedP = ease(Math.min(1, Math.max(0, progress)));

    for (let i = 0; i < count; i++) {
      const init = initialPositions[i];
      const cIdx = clusterAssignments[i];
      const [cx, cy, cz] = CLUSTER_CENTERS[cIdx];
      const f = fitness[i]; // 0=worst, 1=best

      dummy.position.set(
        THREE.MathUtils.lerp(init.x, cx, easedP),
        THREE.MathUtils.lerp(init.y, cy, easedP),
        THREE.MathUtils.lerp(init.z, cz, easedP),
      );

      // Size based on fitness: worst = small (0.025), best = large (0.08)
      const baseSize = 0.025 + f * 0.055;
      const pulse = f > 0.85
        ? 1 + 0.3 * Math.sin(t * 2.5 + i * 0.7)
        : 1;
      dummy.scale.setScalar(baseSize * pulse);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color: worst=muted blue, average=action-azure, best=cofounder-blue
      let color: THREE.Color;
      if (f < 0.3) {
        color = new THREE.Color(GC.dotWorst);
      } else if (f < 0.7) {
        color = new THREE.Color(GC.dotNormal);
      } else {
        color = new THREE.Color(GC.dotBest);
      }
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial
        transparent
        opacity={0.88}
        roughness={0.25}
        metalness={0.15}
        vertexColors
      />
    </instancedMesh>
  );
}

// ─── Cluster center glow markers with halos ───────────────────────────────────

function ClusterMarkers({ progress }: { progress: number }) {
  const opacity = Math.min(1, progress * 2);
  const scaleRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!scaleRef.current) return;
    // Gentle breathing of the whole cluster group
    const s = 1 + 0.04 * Math.sin(t * 1.2);
    scaleRef.current.scale.setScalar(s);
  });

  return (
    <group ref={scaleRef}>
      {CLUSTER_CENTERS.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {/* Inner bright core */}
          <mesh>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              color={GC.clusterMarker}
              emissive={GC.clusterMarker}
              emissiveIntensity={3.5}
              transparent
              opacity={opacity}
            />
          </mesh>
          {/* Outer halo ring */}
          <mesh>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial
              color={GC.clusterMarker}
              emissive={GC.clusterMarker}
              emissiveIntensity={1.0}
              transparent
              opacity={opacity * 0.25}
              wireframe={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Convergence wave (progress > 0.85) ──────────────────────────────────────

function ConvergenceWave({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    if (progress < 0.85) {
      mat.opacity = 0;
      return;
    }
    const t = clock.getElapsedTime();
    // Radial pulse: expand and fade
    const phase = ((t % 2.0) / 2.0);
    meshRef.current.scale.setScalar(0.5 + phase * 4);
    mat.opacity = Math.max(0, 0.35 * (1 - phase));
  });

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.9, 1.0, 48]} />
      <meshBasicMaterial
        color={GC.convergenceWave}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Generation + Cost HUD ────────────────────────────────────────────────────

const COST_INITIAL = 65800;
const COST_FINAL = 50546;

function GenerationHUD({ progress }: { progress: number }) {
  const generation = Math.round(progress * 500);
  const cost = Math.round(COST_INITIAL + (COST_FINAL - COST_INITIAL) * Math.pow(progress, 0.4));
  const fmtCost = '$' + cost.toLocaleString('es-CO');
  const isConverging = progress > 0.85;

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        pointerEvents: 'none',
        fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
        fontSize: '10px',
        letterSpacing: '0.12em',
        color: GC.hudColor,
        opacity: 0.75,
        whiteSpace: 'nowrap',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: 'flex-end',
      }}
      prepend
    >
      <span>GEN {generation} / 500</span>
      <span style={{
        color: isConverging ? tokens.color.actionAzure : GC.hudColor,
        fontWeight: isConverging ? '600' : '400',
        fontSize: '11px',
        letterSpacing: '0.08em',
        transition: 'color 0.3s',
      }}>
        {fmtCost}
      </span>
      {isConverging && (
        <span style={{
          fontSize: '8px',
          color: tokens.color.actionAzure,
          letterSpacing: '0.15em',
          opacity: 0.85,
        }}>
          CONVERGIENDO
        </span>
      )}
    </Html>
  );
}

// ─── Fitness legend HUD ───────────────────────────────────────────────────────

function FitnessLegend() {
  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        pointerEvents: 'none',
        fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
        fontSize: '9px',
        letterSpacing: '0.1em',
        color: GC.hudColor,
        opacity: 0.55,
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
      }}
      prepend
    >
      <span style={{ color: tokens.color.cofounderBlue }}>● ELITE (fitness alto)</span>
      <span style={{ color: tokens.color.actionAzure }}>● NORMAL</span>
      <span style={{ color: '#6c9db5' }}>● DESCARTE (fitness bajo)</span>
    </Html>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({ progress }: PopulationProps) {
  return (
    <>
      <ambientLight intensity={0.4} color={GC.ambientColor} />
      <pointLight position={[3, 3, 3]} intensity={1.6} color={GC.pointLight} />
      <pointLight position={[-3, -2, 2]} intensity={0.6} color={GC.ambientColor} />
      <Population progress={progress} />
      <ClusterMarkers progress={progress} />
      <ConvergenceWave progress={progress} />
      <GenerationHUD progress={progress} />
      <FitnessLegend />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={progress > 0.85 ? 0.8 : 0.35}
        makeDefault={false}
      />
      <EffectComposer>
        <Bloom
          intensity={progress > 0.85 ? 2.2 : 1.4}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function GeneticPopulationR3F({ progress, className }: GeneticPopulationR3FProps) {
  return (
    <Canvas
      className={className}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4.5], fov: 55 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ background: 'transparent' }}
    >
      <Scene progress={progress} />
    </Canvas>
  );
}
