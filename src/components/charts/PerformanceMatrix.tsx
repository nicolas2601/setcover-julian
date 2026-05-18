'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { fmtPct, fmtTime } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Method {
  label: string;
  sublabel: string;
  time_s: number;       // actual execution time in seconds
  quality_pct: number;  // % of ILP optimum reached (lower is worse)
  color: string;
  isWinner?: boolean;
}

// quality = ILP_cost / method_cost * 100
// ILP = 50123, Greedy = 52063, GA = 50546, LP = 27860 (not integer feasible — peg at 55%)
const METHODS: Method[] = [
  {
    label: 'LP',
    sublabel: 'Relajación continua',
    time_s: 0.003,
    quality_pct: 55.6,   // LP is not integer-feasible, positioned lower
    color: tokens.color.lightGray,
  },
  {
    label: 'Greedy',
    sublabel: 'Heurístico voraz',
    time_s: 0.002,
    quality_pct: 96.3,   // 50123/52063*100
    color: tokens.color.mediumGray,
  },
  {
    label: 'GA',
    sublabel: 'Algoritmo genético',
    time_s: 44.1,
    quality_pct: 99.2,   // 50123/50546*100
    color: tokens.color.cofounderBlue,
    isWinner: true,
  },
  {
    label: 'ILP',
    sublabel: 'Branch & Bound',
    time_s: 300.0,
    quality_pct: 100.0,  // reference
    color: tokens.color.darkCharcoal,
  },
];

const PAD = { top: 48, right: 80, bottom: 72, left: 64 };
const CHART_H = 420;

// Log X axis: 0.001 → 400 s
const X_LOG_MIN = Math.log10(0.001);
const X_LOG_MAX = Math.log10(400);
const X_TICKS = [0.001, 0.01, 0.1, 1, 10, 100, 300];

// Y axis: 50% → 101%
const Y_MIN = 50;
const Y_MAX = 101;
const Y_TICKS = [55, 65, 75, 85, 95, 100];

const C = {
  grid:       tokens.color.steelGray,
  label:      tokens.color.mediumGray,
  dark:       tokens.color.darkCharcoal,
  winner:     tokens.color.cofounderBlue,
  quadrantBg: tokens.color.steelGray,
  tooltipBg:  tokens.color.canvasWhite,
  tooltipBdr: tokens.color.steelGray,
} as const;

function toX(t: number, plotW: number): number {
  const logT = Math.log10(Math.max(0.001, t));
  return plotW * ((logT - X_LOG_MIN) / (X_LOG_MAX - X_LOG_MIN));
}

function toY(q: number, plotH: number): number {
  return plotH - ((Math.max(Y_MIN, Math.min(Y_MAX, q)) - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
}

function fmtXTick(v: number): string {
  if (v < 0.01) return `${(v * 1000).toFixed(0)}ms`;
  if (v < 1)    return `${(v * 1000).toFixed(0)}ms`;
  if (v < 60)   return `${v}s`;
  return `${Math.round(v / 60)}min`;
}

interface TooltipState {
  x: number;
  y: number;
  m: Method;
  visible: boolean;
}

const QUADRANT_LABELS = [
  { x: 0.02, y: 0.08, text: 'Calidad alta · Rápido', align: 'start' as const },
  { x: 0.52, y: 0.08, text: 'Calidad alta · Lento', align: 'start' as const },
  { x: 0.02, y: 0.92, text: 'Calidad baja · Rápido', align: 'start' as const },
  { x: 0.52, y: 0.92, text: 'Calidad baja · Lento', align: 'start' as const },
];

// GA is the winner: divide quadrants at GA's position
const GA = METHODS.find(m => m.isWinner)!;

export default function PerformanceMatrix() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const winnerLineXRef = useRef<SVGLineElement>(null);
  const winnerLineYRef = useRef<SVGLineElement>(null);
  const [width, setWidth] = useState(680);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && Number.isFinite(w)) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || 680);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = Math.max(0, CHART_H - PAD.top - PAD.bottom);

  // ── GSAP animate dots ─────────────────────────────────────────────────────

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top 80%',
        once: true,
      },
    });

    dotRefs.current.forEach((el, i) => {
      if (!el) return;
      const m = METHODS[i];
      const finalR = m.isWinner ? 10 : 7;
      gsap.set(el, { attr: { r: 0 } });
      tl.to(el, {
        attr: { r: finalR },
        duration: 0.6,
        ease: 'back.out(1.8)',
        delay: i * 0.1,
      }, 0.2);
    });

    // Winner crosshair lines
    if (winnerLineXRef.current && winnerLineYRef.current) {
      const lx = winnerLineXRef.current;
      const ly = winnerLineYRef.current;
      const lxLen = Number(lx.getAttribute('data-len') ?? plotW);
      const lyLen = Number(ly.getAttribute('data-len') ?? plotH);
      gsap.set(lx, { strokeDasharray: lxLen, strokeDashoffset: lxLen });
      gsap.set(ly, { strokeDasharray: lyLen, strokeDashoffset: lyLen });
      tl.to(lx, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, 0.5);
      tl.to(ly, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }, 0.5);
    }
  }, { scope: wrapRef, dependencies: [width] });

  const handleEnter = useCallback((m: Method, x: number, y: number) => {
    setTooltip({ x, y, m, visible: true });
  }, []);
  const handleLeave = useCallback(() => setTooltip(null), []);

  // GA axis cross position
  const gaX = PAD.left + toX(GA.time_s, plotW);
  const gaY = PAD.top + toY(GA.quality_pct, plotH);

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      <svg
        width={width}
        height={CHART_H + 8}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Matriz calidad vs velocidad por método"
      >
        {/* Quadrant backgrounds (subtle) */}
        {/* Top-left: high quality, fast — ideal */}
        <rect
          x={PAD.left.toFixed(2)}
          y={PAD.top.toFixed(2)}
          width={(gaX - PAD.left).toFixed(2)}
          height={(gaY - PAD.top).toFixed(2)}
          fill={tokens.color.cofounderBlue}
          opacity="0.04"
        />

        {/* Y grid + ticks */}
        {Y_TICKS.map(v => {
          const y = (PAD.top + toY(v, plotH)).toFixed(2);
          return (
            <g key={v}>
              <line
                x1={PAD.left.toFixed(2)} y1={y}
                x2={(PAD.left + plotW).toFixed(2)} y2={y}
                stroke={C.grid} strokeWidth="1" strokeDasharray="4 4" opacity="0.5"
              />
              <text x={(PAD.left - 6).toFixed(2)} y={y}
                fill={C.label} fontSize="10" textAnchor="end" dominantBaseline="middle"
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {v}%
              </text>
            </g>
          );
        })}

        {/* X grid + ticks (log scale) */}
        {X_TICKS.map(v => {
          const x = (PAD.left + toX(v, plotW)).toFixed(2);
          const yBottom = (PAD.top + plotH).toFixed(2);
          return (
            <g key={v}>
              <line
                x1={x} y1={PAD.top.toFixed(2)}
                x2={x} y2={yBottom}
                stroke={C.grid} strokeWidth="1" strokeDasharray="4 4" opacity="0.4"
              />
              <line
                x1={x} y1={yBottom}
                x2={x} y2={(PAD.top + plotH + 4).toFixed(2)}
                stroke={C.grid} strokeWidth="1"
              />
              <text x={x} y={(PAD.top + plotH + 16).toFixed(2)}
                fill={C.label} fontSize="10" textAnchor="middle">
                {fmtXTick(v)}
              </text>
            </g>
          );
        })}

        {/* Baseline + Y axis */}
        <line x1={PAD.left.toFixed(2)} y1={(PAD.top + plotH).toFixed(2)}
          x2={(PAD.left + plotW).toFixed(2)} y2={(PAD.top + plotH).toFixed(2)}
          stroke={C.grid} strokeWidth="1" />
        <line x1={PAD.left.toFixed(2)} y1={PAD.top.toFixed(2)}
          x2={PAD.left.toFixed(2)} y2={(PAD.top + plotH).toFixed(2)}
          stroke={C.grid} strokeWidth="1" />

        {/* Winner crosshair: vertical line through GA */}
        <line
          ref={winnerLineXRef}
          data-len={plotH}
          x1={gaX.toFixed(2)} y1={PAD.top.toFixed(2)}
          x2={gaX.toFixed(2)} y2={(PAD.top + plotH).toFixed(2)}
          stroke={C.winner} strokeWidth="1" strokeDasharray="5 4" opacity="0.4"
        />
        {/* Winner crosshair: horizontal line through GA */}
        <line
          ref={winnerLineYRef}
          data-len={plotW}
          x1={PAD.left.toFixed(2)} y1={gaY.toFixed(2)}
          x2={(PAD.left + plotW).toFixed(2)} y2={gaY.toFixed(2)}
          stroke={C.winner} strokeWidth="1" strokeDasharray="5 4" opacity="0.4"
        />

        {/* Quadrant labels */}
        {QUADRANT_LABELS.map((ql, i) => (
          <text
            key={i}
            x={(PAD.left + ql.x * plotW).toFixed(2)}
            y={(PAD.top + ql.y * plotH).toFixed(2)}
            fill={C.label}
            fontSize="9"
            textAnchor={ql.align}
            opacity="0.55"
          >
            {ql.text}
          </text>
        ))}

        {/* Method dots */}
        {METHODS.map((m, i) => {
          const px = PAD.left + toX(m.time_s, plotW);
          const py = PAD.top + toY(m.quality_pct, plotH);
          const isWinner = m.isWinner;
          const r = isWinner ? 10 : 7;

          return (
            <g key={m.label}>
              {/* Winner glow ring */}
              {isWinner && (
                <>
                  <circle cx={px.toFixed(2)} cy={py.toFixed(2)} r="18"
                    fill="none" stroke={C.winner} strokeWidth="1" opacity="0.15"
                    style={{ animation: 'perfPulse 2.2s ease-in-out infinite' }}
                  />
                  <circle cx={px.toFixed(2)} cy={py.toFixed(2)} r="14"
                    fill="none" stroke={C.winner} strokeWidth="1" opacity="0.25"
                    style={{ animation: 'perfPulse 2.2s ease-in-out infinite 0.4s' }}
                  />
                </>
              )}

              <circle
                ref={el => { dotRefs.current[i] = el; }}
                cx={px.toFixed(2)}
                cy={py.toFixed(2)}
                r="0"
                fill={m.color}
                opacity={isWinner ? 1 : 0.75}
                style={{
                  cursor: 'pointer',
                  filter: isWinner ? `drop-shadow(0 0 8px ${C.winner}66)` : 'none',
                }}
                onMouseEnter={() => handleEnter(m, px, py)}
                onMouseLeave={handleLeave}
              />

              {/* Label — offset to avoid overlap */}
              <text
                x={(px + (isWinner ? 13 : 10)).toFixed(2)}
                y={(py - 6).toFixed(2)}
                fill={m.color}
                fontSize={isWinner ? '11' : '10'}
                fontWeight={isWinner ? '600' : '400'}
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={(PAD.left + plotW / 2).toFixed(2)}
          y={(PAD.top + plotH + 42).toFixed(2)}
          fill={C.label} fontSize="11" textAnchor="middle"
        >
          Tiempo de ejecución (escala log)
        </text>
        <text
          x={(PAD.left - 48).toFixed(2)}
          y={(PAD.top + plotH / 2).toFixed(2)}
          fill={C.label} fontSize="11" textAnchor="middle"
          transform={`rotate(-90, ${(PAD.left - 48).toFixed(2)}, ${(PAD.top + plotH / 2).toFixed(2)})`}
        >
          Calidad (% del óptimo)
        </text>

        {/* Tooltip */}
        {tooltip && tooltip.visible && (
          <g>
            <rect
              x={(tooltip.x + 12).toFixed(2)}
              y={(tooltip.y - 40).toFixed(2)}
              width="152"
              height="68"
              rx="4"
              fill={C.tooltipBg}
              stroke={C.tooltipBdr}
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}
            />
            <text x={(tooltip.x + 18).toFixed(2)} y={(tooltip.y - 24).toFixed(2)}
              fill={C.label} fontSize="10">{tooltip.m.sublabel}</text>
            <text x={(tooltip.x + 18).toFixed(2)} y={(tooltip.y - 9).toFixed(2)}
              fill={tooltip.m.isWinner ? C.winner : C.dark}
              fontSize="12" fontWeight="600"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtPct(tooltip.m.quality_pct, 1)} calidad
            </text>
            <text x={(tooltip.x + 18).toFixed(2)} y={(tooltip.y + 8).toFixed(2)}
              fill={C.label} fontSize="10"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtTime(tooltip.m.time_s)} ejecución
            </text>
            {tooltip.m.isWinner && (
              <text x={(tooltip.x + 18).toFixed(2)} y={(tooltip.y + 22).toFixed(2)}
                fill={C.winner} fontSize="9" fontWeight="600">
                MEJOR RELACION COSTO-TIEMPO
              </text>
            )}
          </g>
        )}

        {/* Log scale note */}
        <text x={(PAD.left + plotW).toFixed(2)} y={(PAD.top - 8).toFixed(2)}
          fill={C.label} fontSize="9" textAnchor="end" opacity="0.6">
          eje X: escala logarítmica
        </text>
      </svg>

      <style>{`
        @keyframes perfPulse {
          0%, 100% { opacity: 0.12; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}
