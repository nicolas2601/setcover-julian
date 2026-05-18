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

// ─── LCG ─────────────────────────────────────────────────────────────────────

function lcgRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Three cluster centers ───────────────────────────────────────────────────

const CLUSTER_CENTERS: [number, number, number][] = [
  [-1.2, 0.5, 0.3],
  [1.1, -0.4, -0.2],
  [0.1, 0.8, -1.0],
];

// ─── Population of 150 instanced spheres ─────────────────────────────────────

function Population({ progress }: PopulationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 150;

  const { initialPositions, clusterAssignments, isBest } = useMemo(() => {
    const rand = lcgRand(77);
    const initPos: THREE.Vector3[] = [];
    const clusterAss: number[] = [];
    const best = new Uint8Array(count);

    for (let i = 0; i < count; i++) {
      // Scattered initial positions in sphere of radius 2.5
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
      // Assign to cluster — best ~15% are "high fitness"
      clusterAss.push(Math.floor(rand() * CLUSTER_CENTERS.length));
      best[i] = rand() < 0.15 ? 1 : 0;
    }

    return { initialPositions: initPos, clusterAssignments: clusterAss, isBest: best };
  }, []);

  // Eased progress for convergence
  const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const easedP = ease(Math.min(1, Math.max(0, progress)));
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const init = initialPositions[i];
      const cIdx = clusterAssignments[i];
      const [cx, cy, cz] = CLUSTER_CENTERS[cIdx];

      // Interpolate toward cluster center
      dummy.position.set(
        THREE.MathUtils.lerp(init.x, cx, easedP),
        THREE.MathUtils.lerp(init.y, cy, easedP),
        THREE.MathUtils.lerp(init.z, cz, easedP),
      );

      // Scale pulsing for best members
      const pulse = isBest[i]
        ? 1 + 0.25 * Math.sin(Date.now() * 0.003 + i)
        : 1;
      dummy.scale.setScalar(isBest[i] ? 0.065 * pulse : 0.04);

      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Color: best → burntSienna, others → warmCream at 40% opacity
      const color = isBest[i]
        ? new THREE.Color(tokens.color.burntSienna)
        : new THREE.Color(tokens.color.warmCream);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial
        transparent
        opacity={0.85}
        roughness={0.3}
        metalness={0.1}
        vertexColors
      />
    </instancedMesh>
  );
}

// ─── Cluster center glow markers ─────────────────────────────────────────────

function ClusterMarkers({ progress }: { progress: number }) {
  const opacity = Math.min(1, progress * 2);

  return (
    <>
      {CLUSTER_CENTERS.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color={tokens.color.burntSienna}
            emissive={tokens.color.burntSienna}
            emissiveIntensity={2.5}
            transparent
            opacity={opacity}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Generation HUD ───────────────────────────────────────────────────────────

function GenerationHUD({ progress }: { progress: number }) {
  const generation = Math.round(progress * 500);

  return (
    <Html
      position={[0, 0, 0]}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        pointerEvents: 'none',
        fontFamily: 'var(--font-jakarta), ui-monospace, monospace',
        fontSize: '10px',
        letterSpacing: '0.12em',
        color: tokens.color.warmCream,
        opacity: 0.7,
        whiteSpace: 'nowrap',
      }}
      prepend
    >
      GENERACIÓN {generation} / 500
    </Html>
  );
}

// ─── Inner scene ──────────────────────────────────────────────────────────────

function Scene({ progress }: PopulationProps) {
  return (
    <>
      <ambientLight intensity={0.4} color={tokens.color.warmCream} />
      <pointLight
        position={[3, 3, 3]}
        intensity={1.2}
        color={tokens.color.burntSienna}
      />
      <Population progress={progress} />
      <ClusterMarkers progress={progress} />
      <GenerationHUD progress={progress} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.4}
        makeDefault={false}
      />
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.8}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function GeneticPopulationR3F({
  progress,
  className,
}: GeneticPopulationR3FProps) {
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
