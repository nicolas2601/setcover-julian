'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { tokens } from '@/lib/tokens';
import { SELECTED_EXACT_ANTENNAS } from '@/lib/results';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatrixConstellationProps {
  className?: string;
}

interface AntennaPoint {
  cx: number;
  cy: number;
  selected: boolean;
  /** index 0-based */
  idx: number;
}

// ─── LCG for deterministic positions (SSR-safe) ───────────────────────────────

function lcgRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Generate 500 antenna positions ──────────────────────────────────────────

function buildAntennas(w: number, h: number): AntennaPoint[] {
  const rand = lcgRand(42);
  const selectedSet = new Set(SELECTED_EXACT_ANTENNAS);
  const points: AntennaPoint[] = [];

  // Fibonacci spiral within a disc to mimic the WebGL distribution
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.42;
  const ry = h * 0.34;

  for (let i = 0; i < 500; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / 500);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const jitter = 0.12 * rand();

    const x = cx + rx * (1 + jitter) * Math.sin(phi) * Math.cos(theta);
    const y = cy + ry * (1 + jitter) * Math.cos(phi);

    points.push({
      cx: parseFloat(x.toFixed(2)),
      cy: parseFloat(y.toFixed(2)),
      selected: selectedSet.has(i + 1),
      idx: i,
    });
  }

  return points;
}

// ─── Cross mark for client coverage (50 sample) ──────────────────────────────

function crossPath(cx: number, cy: number, size = 3): string {
  const cxF = cx.toFixed(2);
  const cyF = cy.toFixed(2);
  const s = size.toFixed(2);
  const hs = (size / 2).toFixed(2);
  return `M ${(cx - size / 2).toFixed(2)} ${cy.toFixed(2)} h ${s} M ${cxF} ${(cy - size / 2).toFixed(2)} v ${s}`;
}

// ─── SVG constellation (SSR-safe, no canvas) ──────────────────────────────────

const ANTENNAS_500 = buildAntennas(540, 360);

// 50 client crosses — LCG positions in top-left quadrant
const CLIENT_CROSSES = (() => {
  const rand = lcgRand(99);
  return Array.from({ length: 50 }, (_, i) => ({
    cx: parseFloat((30 + rand() * 480).toFixed(2)),
    cy: parseFloat((20 + rand() * 320).toFixed(2)),
    key: `cc-${i}`,
  }));
})();

export default function MatrixConstellation({ className }: MatrixConstellationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const frameRef = useRef<number>(0);
  const rotationRef = useRef(0);
  const mouseRef = useRef<[number, number]>([0, 0]);

  const animate = useCallback(() => {
    const group = groupRef.current;
    if (!group) return;

    rotationRef.current += 0.02; // degrees per frame
    const [mx, my] = mouseRef.current;

    // Parallax offset from mouse
    const px = mx * 12;
    const py = my * 8;

    group.setAttribute(
      'transform',
      `translate(270 180) rotate(${rotationRef.current.toFixed(3)}) translate(-270 -180) translate(${px.toFixed(2)} ${py.toFixed(2)})`,
    );

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Reduced motion check
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!query.matches) {
      frameRef.current = requestAnimationFrame(animate);
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = [
        (e.clientX / window.innerWidth - 0.5) * 2,
        -(e.clientY / window.innerHeight - 0.5) * 2,
      ];
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [animate]);

  return (
    <svg
      ref={svgRef}
      className={className}
      width="540"
      height="360"
      viewBox="0 0 540 360"
      aria-label="Constelación de 500 antenas"
      style={{ display: 'block' }}
    >
      <g ref={groupRef}>
        {/* Regular antennas */}
        {ANTENNAS_500.filter(a => !a.selected).map(a => (
          <circle
            key={a.idx}
            cx={a.cx}
            cy={a.cy}
            r="1.6"
            fill={tokens.color.warmCream}
            opacity="0.32"
          />
        ))}

        {/* Selected antennas (22 burnt-sienna) */}
        {ANTENNAS_500.filter(a => a.selected).map(a => (
          <circle
            key={a.idx}
            cx={a.cx}
            cy={a.cy}
            r="3.5"
            fill={tokens.color.burntSienna}
            opacity="0.95"
          />
        ))}

        {/* Client crosses (50) */}
        {CLIENT_CROSSES.map(({ cx, cy, key }) => (
          <path
            key={key}
            d={crossPath(cx, cy, 4)}
            stroke={tokens.color.corkShadow}
            strokeWidth="1"
            opacity="0.5"
            fill="none"
          />
        ))}
      </g>
    </svg>
  );
}
