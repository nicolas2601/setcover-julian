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

// ─── Component ───────────────────────────────────────────────────────────────

export default function MatrixGridSVG({ progress, className }: MatrixGridSVGProps) {
  // How many cells are active — diagonal wave from top-left to bottom-right
  const activeCount = Math.round(Math.min(1, Math.max(0, progress)) * TOTAL);

  // Scanning line position (diagonal)
  const scanProgress = Math.min(1, progress * 1.05);
  const scanX = (WIDTH + HEIGHT) * scanProgress;

  // Precompute cell states with diagonal wave ordering
  const cells = useMemo(() => {
    const list: { x: number; y: number; active: boolean; key: string }[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // Diagonal order index: cells closer to top-left activate first
        const diagOrder = col + row; // 0 → (COLS-1 + ROWS-1)
        const maxDiag = COLS + ROWS - 2;
        const threshold = Math.round((diagOrder / maxDiag) * TOTAL);

        list.push({
          x: col * CELL_STEP,
          y: row * CELL_STEP,
          active: activeCount > threshold,
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
          fontFamily: 'var(--font-jakarta), ui-monospace, monospace',
          fontSize: '10px',
          letterSpacing: '0.14em',
          color: tokens.color.warmCream,
          opacity: 0.65,
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
        {cells.map(({ x, y, active, key }) => (
          <rect
            key={key}
            x={x.toFixed(2)}
            y={y.toFixed(2)}
            width={CELL}
            height={CELL}
            fill={active ? tokens.color.burntSienna : tokens.color.corkShadow}
            opacity={active ? 0.85 : 0.4}
          />
        ))}

        {/* Diagonal scanning line */}
        <line
          x1={Math.max(0, scanX - HEIGHT).toFixed(2)}
          y1={Math.min(HEIGHT, scanX).toFixed(2)}
          x2={Math.min(WIDTH, scanX).toFixed(2)}
          y2={Math.max(0, scanX - WIDTH).toFixed(2)}
          stroke={tokens.color.warmCream}
          strokeWidth="1"
          opacity={scanProgress < 1 ? 0.45 : 0}
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
}
