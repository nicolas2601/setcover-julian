'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

// ─── Generate synthetic 50×50 SCP coverage matrix ────────────────────────────

function lcgRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const ROWS = 50; // clientes
const COLS = 50; // antenas (subset of 500)
const CELL = 8;
const GAP = 1;

interface CellData {
  row: number;
  col: number;
  overlap: number; // 0 = inactive, 1-5 = overlap count
}

function buildMatrix(): CellData[][] {
  const rand = lcgRand(31337);
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => {
      // ~25% density, overlap weighted
      const r1 = rand();
      let overlap = 0;
      if (r1 < 0.25) {
        const r2 = rand();
        overlap = r2 < 0.5 ? 1 : r2 < 0.75 ? 2 : r2 < 0.90 ? 3 : r2 < 0.97 ? 4 : 5;
      }
      return { row, col, overlap };
    }),
  );
}

const MATRIX = buildMatrix();

// Total width: COLS * (CELL + GAP) - GAP
const SVG_W = COLS * (CELL + GAP) - GAP;
const SVG_H = ROWS * (CELL + GAP) - GAP;
const LABEL_H = 24;
const LABEL_W = 56;

const C = {
  inactive:   tokens.color.steelGray,        // #dee2de
  active1:    tokens.color.actionAzure,      // #41a1cf opacity scaled
  active5:    tokens.color.cofounderBlue,    // #0081c0
  scanLine:   tokens.color.cofounderBlue,
  tooltipBg:  tokens.color.canvasWhite,
  tooltipBdr: tokens.color.steelGray,
  label:      tokens.color.mediumGray,
  dark:       tokens.color.darkCharcoal,
} as const;

function cellFill(overlap: number): string {
  if (overlap === 0) return C.inactive;
  // Interpolate: 1 = 20% opacity azure, 5 = 100% cofounder-blue
  // Return hex directly so SVG can use it
  return C.active5;
}

function cellOpacity(overlap: number): number {
  if (overlap === 0) return 0.18;
  return 0.2 + (overlap / 5) * 0.8;
}

interface Props {
  progress?: number; // 0→1 for scrub mode; if undefined → auto-animate on view
}

interface TooltipState {
  x: number;
  y: number;
  row: number;
  col: number;
  overlap: number;
  visible: boolean;
}

export default function MatrixHeatmap({ progress }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scanRef = useRef<SVGRectElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const [containerW, setContainerW] = useState(SVG_W + LABEL_W);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [revealedCols, setRevealedCols] = useState(COLS); // default: all visible

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && Number.isFinite(w)) setContainerW(w);
    });
    ro.observe(el);
    setContainerW(el.getBoundingClientRect().width || SVG_W + LABEL_W);
    return () => ro.disconnect();
  }, []);

  // ── GSAP scan animation ───────────────────────────────────────────────────

  useGSAP(() => {
    const scan = scanRef.current;
    if (!scan) return;

    if (progress !== undefined) {
      // Scrub mode: progress 0→1 → scanLine from left to right
      gsap.set(scan, { x: progress * SVG_W, opacity: 0.6 });
      setRevealedCols(Math.round(progress * COLS));
      return;
    }

    // Auto-animate once on scroll entry
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top 80%',
        once: true,
      },
    });

    gsap.set(scan, { x: 0, opacity: 0.7 });

    tl.to(scan, {
      x: SVG_W,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: function () {
        const x = gsap.getProperty(scan, 'x') as number;
        setRevealedCols(Math.round((x / SVG_W) * COLS));
      },
      onComplete: () => {
        gsap.to(scan, { opacity: 0, duration: 0.5 });
        setRevealedCols(COLS);
      },
    });
  }, { scope: wrapRef, dependencies: [progress] });

  const handleCellEnter = useCallback((row: number, col: number, overlap: number, ex: number, ey: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ex - rect.left;
    const svgY = ey - rect.top;
    setTooltip({ x: svgX, y: svgY, row, col, overlap, visible: true });
  }, []);
  const handleCellLeave = useCallback(() => setTooltip(null), []);

  // Scale to fit container
  const totalW = SVG_W + LABEL_W;
  const scale = Math.min(1, containerW / totalW);
  const viewH = (SVG_H + LABEL_H) * scale;

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family, position: 'relative' }}>
      <svg
        ref={svgRef}
        width={containerW}
        height={viewH + 8}
        viewBox={`0 0 ${totalW} ${SVG_H + LABEL_H + 8}`}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Matriz de cobertura SCP — 50 clientes × 50 antenas"
      >
        {/* Column header */}
        <text x={(LABEL_W + SVG_W / 2).toFixed(2)} y="14"
          fill={C.label} fontSize="9" textAnchor="middle">
          Antenas (columnas) →
        </text>

        {/* Row header */}
        <text
          x={(LABEL_W - 4).toFixed(2)}
          y={(LABEL_H + SVG_H / 2).toFixed(2)}
          fill={C.label} fontSize="9" textAnchor="middle"
          transform={`rotate(-90, ${(LABEL_W - 4).toFixed(2)}, ${(LABEL_H + SVG_H / 2).toFixed(2)})`}
        >
          Clientes (filas) ↓
        </text>

        {/* Cell grid */}
        <g ref={groupRef} transform={`translate(${LABEL_W}, ${LABEL_H})`}>
          {MATRIX.map((rowData, row) =>
            rowData.map(({ col, overlap }) => {
              const x = col * (CELL + GAP);
              const y = row * (CELL + GAP);
              const revealed = col < revealedCols;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={x.toFixed(2)}
                  y={y.toFixed(2)}
                  width={CELL.toFixed(2)}
                  height={CELL.toFixed(2)}
                  fill={cellFill(overlap)}
                  opacity={revealed ? cellOpacity(overlap) : 0.04}
                  rx="1"
                  style={{ cursor: overlap > 0 ? 'pointer' : 'default', transition: 'opacity 0.1s' }}
                  onMouseEnter={overlap > 0 ? e => handleCellEnter(row, col, overlap, e.clientX, e.clientY) : undefined}
                  onMouseLeave={overlap > 0 ? handleCellLeave : undefined}
                />
              );
            }),
          )}

          {/* Scan line */}
          <rect
            ref={scanRef}
            x="0"
            y="0"
            width="3"
            height={SVG_H.toFixed(2)}
            fill={C.scanLine}
            opacity="0.7"
            rx="1"
            style={{ pointerEvents: 'none' }}
          />
        </g>

        {/* Color scale legend */}
        {Array.from({ length: 5 }, (_, i) => {
          const lx = LABEL_W + SVG_W + 8;
          const ly = LABEL_H + i * 16;
          return (
            <g key={i}>
              <rect
                x={lx.toFixed(2)} y={ly.toFixed(2)}
                width="10" height="10"
                fill={C.active5}
                opacity={(0.2 + (i + 1) / 5 * 0.8).toFixed(2)}
                rx="1"
              />
              <text x={(lx + 14).toFixed(2)} y={(ly + 8).toFixed(2)}
                fill={C.label} fontSize="8">
                {i + 1}×
              </text>
            </g>
          );
        })}
        <text x={(LABEL_W + SVG_W + 8).toFixed(2)} y={(LABEL_H + 5 * 16 + 10).toFixed(2)}
          fill={C.label} fontSize="7.5" opacity="0.7">
          cobertura
        </text>

        {/* Tooltip */}
        {tooltip && tooltip.visible && (
          <g>
            <rect
              x={(tooltip.x + 10).toFixed(2)}
              y={(tooltip.y - 42).toFixed(2)}
              width="148"
              height="58"
              rx="4"
              fill={C.tooltipBg}
              stroke={C.tooltipBdr}
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}
            />
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y - 26).toFixed(2)}
              fill={C.label} fontSize="10">
              Antena {tooltip.col + 1} · Cliente {tooltip.row + 1}
            </text>
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y - 11).toFixed(2)}
              fill={C.dark} fontSize="11" fontWeight="500">
              Cobertura: {tooltip.overlap}× solapamiento
            </text>
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y + 4).toFixed(2)}
              fill={C.active5} fontSize="9">
              CELDA ACTIVA
            </text>
          </g>
        )}
      </svg>

      {/* Caption */}
      <p style={{
        fontSize: '10px',
        color: C.label,
        marginTop: '6px',
        lineHeight: 1.5,
      }}>
        Visualización de 2 500 celdas (50×50 submuestra). Azul = antena cubre cliente.
        Intensidad = nivel de solapamiento (1–5 antenas cubren el mismo cliente).
      </p>
    </div>
  );
}
