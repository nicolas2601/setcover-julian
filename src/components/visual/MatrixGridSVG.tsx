'use client';

import React, { useMemo } from 'react';
import { tokens } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatrixGridSVGProps {
  /** 0 → 1: how much of the matrix has been revealed (scroll-driven) */
  progress: number;
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLS = 50;
const ROWS = 50;
const CELL = 8;
const GAP = 1;
const CELL_STEP = CELL + GAP;
const WIDTH = COLS * CELL_STEP - GAP;
const HEIGHT = ROWS * CELL_STEP - GAP;
const TOTAL = COLS * ROWS; // 2500 representative cells

// GIC light theme for matrix — this may sit on either light or dark bg
// Active cells → cofounder-blue (with opacity ramp)
// Inactive → cool-gray
// Scan line → cofounder-blue 0.5 opacity
const MC = {
  active:   tokens.color.cofounderBlue, // #0081c0
  inactive: tokens.color.coolGray,      // #eef1ed
  scan:     tokens.color.cofounderBlue, // #0081c0
  hud:      tokens.color.mediumGray,    // #646464
} as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function MatrixGridSVG({ progress, className }: MatrixGridSVGProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  // How many cells are active — diagonal wave from top-left to bottom-right
  const activeCount = Math.round(clampedProgress * TOTAL);

  // Scanning line position (diagonal)
  const scanProgress = Math.min(1, clampedProgress * 1.05);
  const scanX = (WIDTH + HEIGHT) * scanProgress;

  // Precompute cell states with diagonal wave ordering
  const cells = useMemo(() => {
    const list: { x: number; y: number; active: boolean; key: string; opacity: number }[] = [];
    const maxDiag = COLS + ROWS - 2;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const diagOrder = col + row;
        const threshold = Math.round((diagOrder / maxDiag) * TOTAL);
        const active = activeCount > threshold;

        // Opacity ramp: cells closer to the scan front are brighter
        const distFromFront = active
          ? Math.min(1, (activeCount - threshold) / (TOTAL * 0.15))
          : 0;
        const opacity = active ? 0.45 + 0.55 * distFromFront : 0.35;

        list.push({
          x: col * CELL_STEP,
          y: row * CELL_STEP,
          active,
          opacity,
          key: `${row}-${col}`,
        });
      }
    }
    return list;
  }, [activeCount]);

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block' }}>
      {/* HUD overlay */}
      <div
        style={{
          position: 'absolute',
          top: '-28px',
          left: '0',
          fontFamily: 'var(--font-jetbrains), ui-monospace, monospace',
          fontSize: '10px',
          letterSpacing: '0.14em',
          color: MC.hud,
          opacity: 0.75,
          pointerEvents: 'none',
        }}
      >
        {activeCount.toLocaleString('es-CO')} / 2.500 celdas activas
      </div>

      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        {/* Cells */}
        {cells.map(({ x, y, active, opacity, key }) => (
          <rect
            key={key}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            width={CELL}
            height={CELL}
            fill={active ? MC.active : MC.inactive}
            opacity={Number.isFinite(opacity) ? opacity : 0.35}
          />
        ))}

        {/* Diagonal scanning line — cofounder-blue 0.5 opacity */}
        <line
          x1={Math.max(0, scanX - HEIGHT).toFixed(2)}
          y1={Math.min(HEIGHT, scanX).toFixed(2)}
          x2={Math.min(WIDTH, scanX).toFixed(2)}
          y2={Math.max(0, scanX - WIDTH).toFixed(2)}
          stroke={MC.scan}
          strokeWidth="1.5"
          opacity={scanProgress < 1 ? 0.5 : 0}
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
}
