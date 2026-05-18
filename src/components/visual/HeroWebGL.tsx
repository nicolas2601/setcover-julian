'use client';

import React, { useRef, useMemo, useCallback, useEffect, type CSSProperties } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import * as maath from 'maath';
import { tokens } from '@/lib/tokens';
import { SELECTED_EXACT_ANTENNAS } from '@/lib/results';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HeroWebGLProps {
  className?: string;
  style?: React.CSSProperties;
}

interface SceneProps {
  prefersReducedMotion: boolean;
}

// GIC hero colors — dark scene (night-sky bg provided by parent .dark-section)
const HC = {
  regularPoint:   '#ffffff',              // canvas-white — all unselected antennas
  highlightPoint: tokens.color.cofounderBlue, // #0081c0 — 22 selected antennas
  dotGrid:        tokens.color.steelGray, // #dee2de subtle floor grid
} as const;

// ─── LCG deterministic random (SSR-safe) ─────────────────────────────────────

function lcgRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Generate 500 antenna positions on flattened spherical distribution ───────

function useAntennaPositions(count = 500) {
  return useMemo(() => {
    const rand = lcgRand(42);
    const positions = new Float32Array(count * 3);
    const highlights = new Uint8Array(count);
    const selectedSet = new Set(SELECTED_EXACT_ANTENNAS);

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - 2 * (i + 0.5) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 2.8;

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.35;
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const jitter = 0.15 * rand();
      positions[i * 3 + 0] *= 1 + jitter;
      positions[i * 3 + 2] *= 1 + jitter;

      highlights[i] = selectedSet.has(i + 1) ? 1 : 0;
    }

    return { positions, highlights };
  }, []);
}

// ─── Dot-grid plane for depth ─────────────────────────────────────────────────

function DotGrid() {
  const gridRef = useRef<THREE.Points>(null);
  const count = 40 * 40;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    let idx = 0;
    for (let i = 0; i < 40; i++) {
      for (let j = 0; j < 40; j++) {
        pos[idx++] = (i - 20) * 0.2;
        pos[idx++] = -1.8;
        pos[idx++] = (j - 20) * 0.2;
      }
    }
    return pos;
  }, [count]);

  return (
    <points ref={gridRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.012}
        color={HC.dotGrid}
        transparent
        opacity={0.08}
        sizeAttenuation
      />
    </points>
  );
}

// ─── Antenna cloud ────────────────────────────────────────────────────────────

function AntennaCloud({ prefersReducedMotion }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { positions, highlights } = useAntennaPositions(500);

  const { highlightPos, regularPos } = useMemo(() => {
    const hPos: number[] = [];
    const rPos: number[] = [];
    for (let i = 0; i < 500; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      if (highlights[i]) {
        hPos.push(x, y, z);
      } else {
        rPos.push(x, y, z);
      }
    }
    return {
      highlightPos: new Float32Array(hPos),
      regularPos: new Float32Array(rPos),
    };
  }, [positions, highlights]);

  const clock = useMemo(() => ({ t: 0 }), []);

  useFrame((_state, delta) => {
    if (prefersReducedMotion || !groupRef.current) return;
    clock.t += delta;
    groupRef.current.rotation.y += delta * 0.06;
    groupRef.current.position.y = Math.sin(clock.t * 0.3) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* Regular antennas — white, low opacity */}
      <Points positions={regularPos} stride={3} frustumCulled={false}>
        <PointMaterial
          size={0.022}
          color={HC.regularPoint}
          transparent
          opacity={0.30}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>

      {/* Highlighted (selected) antennas — cofounder-blue bloom */}
      <Points positions={highlightPos} stride={3} frustumCulled={false}>
        <PointMaterial
          size={0.052}
          color={HC.highlightPoint}
          transparent
          opacity={1}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

// ─── Camera parallax on mouse ─────────────────────────────────────────────────

function CameraRig({ prefersReducedMotion }: SceneProps) {
  const { camera } = useThree();
  const mouse = useRef<[number, number]>([0, 0]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouse.current = [
      (e.clientX / window.innerWidth - 0.5) * 2,
      -(e.clientY / window.innerHeight - 0.5) * 2,
    ];
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useFrame((_state, delta) => {
    if (prefersReducedMotion) return;
    const [mx, my] = mouse.current;
    maath.easing.damp3(
      camera.position,
      [mx * 0.6, my * 0.3 + 0, 6],
      0.25,
      delta,
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ─── Inner scene ──────────────────────────────────────────────────────────────

function Scene({ prefersReducedMotion }: SceneProps) {
  return (
    <>
      <DotGrid />
      <AntennaCloud prefersReducedMotion={prefersReducedMotion} />
      <CameraRig prefersReducedMotion={prefersReducedMotion} />
      <EffectComposer>
        <Bloom
          intensity={0.45}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────

export default function HeroWebGL({ className, style }: HeroWebGLProps) {
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  return (
    <Canvas
      className={className}
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ background: 'transparent', ...style } as CSSProperties}
    >
      <Scene prefersReducedMotion={prefersReducedMotion} />
    </Canvas>
  );
}
