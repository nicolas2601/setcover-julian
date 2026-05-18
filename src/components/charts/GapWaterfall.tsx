'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { fmtMoney, fmtPct } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

// ─── Waterfall data ───────────────────────────────────────────────────────────

interface Step {
  label: string;
  sublabel: string;
  cost: number;
  color: string;
  isOptimal?: boolean;
}

const STEPS: Step[] = [
  {
    label: 'Cota LP',
    sublabel: 'Relajación continua',
    cost: 27860,
    color: tokens.color.lightGray,
  },
  {
    label: 'Greedy',
    sublabel: 'Heurístico voraz',
    cost: 52063,
    color: tokens.color.mediumGray,
  },
  {
    label: 'GA',
    sublabel: 'Algoritmo genético',
    cost: 50546,
    color: tokens.color.actionAzure,
  },
  {
    label: 'ILP',
    sublabel: 'Branch & Bound exacto',
    cost: 50123,
    color: tokens.color.cofounderBlue,
    isOptimal: true,
  },
];

const PAD = { top: 40, right: 80, bottom: 64, left: 72 };
const CHART_H = 400;
const BAR_W_FRAC = 0.55;
const Y_MIN = 20000;
const Y_MAX = 60000;

const C = {
  grid:       tokens.color.steelGray,
  label:      tokens.color.mediumGray,
  dark:       tokens.color.darkCharcoal,
  connector:  tokens.color.steelGray,
  tooltipBg:  tokens.color.canvasWhite,
  tooltipBdr: tokens.color.steelGray,
  optimal:    tokens.color.cofounderBlue,
} as const;

function toY(v: number, plotH: number): number {
  if (!Number.isFinite(v)) return plotH;
  return plotH - ((Math.max(Y_MIN, Math.min(Y_MAX, v)) - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
}

const Y_TICKS = [20000, 30000, 40000, 50000, 60000];

interface TooltipState {
  x: number;
  y: number;
  step: Step;
  visible: boolean;
}

export default function GapWaterfall() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(SVGRectElement | null)[]>([]);
  const connRefs = useRef<(SVGLineElement | null)[]>([]);
  const deltaRefs = useRef<(SVGTextElement | null)[]>([]);
  const [width, setWidth] = useState(680);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hovIdx, setHovIdx] = useState<number | null>(null);

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
  const n = STEPS.length;
  const step = plotW / n;
  const barW = step * BAR_W_FRAC;

  // ── GSAP animate step by step on scroll ──────────────────────────────────

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top 80%',
        once: true,
      },
    });

    barRefs.current.forEach((el, i) => {
      if (!el) return;
      const finalH = Number(el.getAttribute('data-h') ?? 0);
      const finalY = Number(el.getAttribute('data-y') ?? 0);
      gsap.set(el, { attr: { height: 0, y: finalY + finalH } });
      tl.to(el, {
        attr: { height: finalH.toFixed(2), y: finalY.toFixed(2) },
        duration: 0.65,
        ease: 'back.out(1.3)',
      }, i * 0.18);
    });

    // Connector lines
    connRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { opacity: 0 });
      tl.to(el, { opacity: 0.5, duration: 0.3, ease: 'power2.out' }, i * 0.18 + 0.45);
    });

    // Delta labels
    deltaRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { opacity: 0, y: 6 });
      tl.to(el, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, i * 0.18 + 0.5);
    });
  }, { scope: wrapRef, dependencies: [width] });

  const handleEnter = useCallback((step: Step, idx: number, bx: number, by: number) => {
    setTooltip({ x: bx + PAD.left, y: by + PAD.top, step, visible: true });
    setHovIdx(idx);
  }, []);
  const handleLeave = useCallback(() => {
    setTooltip(null);
    setHovIdx(null);
  }, []);

  // LP cost as reference line
  const lpY = PAD.top + toY(STEPS[0].cost, plotH);

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      <svg
        width={width}
        height={CHART_H + 16}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Waterfall de gap entre métodos"
      >
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
                fill={C.label} fontSize="11" textAnchor="end" dominantBaseline="middle">
                {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              </text>
            </g>
          );
        })}

        {/* LP cota reference line */}
        <line
          x1={PAD.left.toFixed(2)} y1={lpY.toFixed(2)}
          x2={(PAD.left + plotW).toFixed(2)} y2={lpY.toFixed(2)}
          stroke={C.connector} strokeWidth="1" strokeDasharray="6 4" opacity="0.4"
        />
        <text x={(PAD.left - 6).toFixed(2)} y={(lpY - 6).toFixed(2)}
          fill={C.label} fontSize="9" textAnchor="end" opacity="0.7">
          LP
        </text>

        {/* Baseline */}
        <line
          x1={PAD.left.toFixed(2)} y1={(PAD.top + plotH).toFixed(2)}
          x2={(PAD.left + plotW).toFixed(2)} y2={(PAD.top + plotH).toFixed(2)}
          stroke={C.grid} strokeWidth="1"
        />

        {/* Bars + connectors + deltas */}
        {STEPS.map((s, i) => {
          const bx = step * i + (step - barW) / 2;
          const barTopY = toY(s.cost, plotH);
          const barH = Math.max(4, plotH - barTopY);
          const isHov = hovIdx === i;
          const isOpt = s.isOptimal;

          // Delta label (vs previous)
          const prev = i > 0 ? STEPS[i - 1] : null;
          const delta = prev ? s.cost - prev.cost : null;
          const deltaPct = prev && Number.isFinite(prev.cost) && prev.cost > 0
            ? ((s.cost - prev.cost) / prev.cost) * 100 : null;

          // Stepped connector (from previous bar top to this bar top)
          const prevBx = i > 0 ? step * (i - 1) + (step - barW) / 2 + barW : null;
          const prevTopY = i > 0 ? toY(STEPS[i - 1].cost, plotH) : null;

          return (
            <g key={s.label}>
              {/* Step connector line */}
              {prevBx !== null && prevTopY !== null && (
                <line
                  ref={el => { connRefs.current[i - 1] = el; }}
                  x1={(PAD.left + prevBx).toFixed(2)}
                  y1={(PAD.top + prevTopY).toFixed(2)}
                  x2={(PAD.left + bx).toFixed(2)}
                  y2={(PAD.top + barTopY).toFixed(2)}
                  stroke={C.connector}
                  strokeWidth="1"
                  strokeDasharray="4 3"
                  opacity="0"
                />
              )}

              {/* Bar */}
              <rect
                ref={el => { barRefs.current[i] = el; }}
                data-h={barH.toFixed(2)}
                data-y={(PAD.top + barTopY).toFixed(2)}
                x={(PAD.left + bx).toFixed(2)}
                y={(PAD.top + barTopY).toFixed(2)}
                width={barW.toFixed(2)}
                height="0"
                fill={s.color}
                opacity={isHov ? 1 : (isOpt ? 1 : 0.75)}
                rx="3"
                style={{
                  cursor: 'pointer',
                  filter: isOpt && !isHov ? `drop-shadow(0 0 8px ${C.optimal}44)` : 'none',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={() => handleEnter(s, i, bx + barW / 2, barTopY)}
                onMouseLeave={handleLeave}
              />

              {/* Optimal ring */}
              {isOpt && (
                <rect
                  x={(PAD.left + bx - 3).toFixed(2)}
                  y={(PAD.top + barTopY - 3).toFixed(2)}
                  width={(barW + 6).toFixed(2)}
                  height={(barH + 6).toFixed(2)}
                  rx="5"
                  fill="none"
                  stroke={C.optimal}
                  strokeWidth="1.5"
                  opacity="0.4"
                  style={{ animation: 'optPulse 2s ease-in-out infinite' }}
                />
              )}

              {/* Value label above bar */}
              <text
                x={(PAD.left + bx + barW / 2).toFixed(2)}
                y={(PAD.top + barTopY - 8).toFixed(2)}
                textAnchor="middle"
                fill={isOpt ? C.optimal : C.dark}
                fontSize="11"
                fontWeight={isOpt ? '600' : '400'}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmtMoney(s.cost)}
              </text>

              {/* Delta label between bars */}
              {delta !== null && deltaPct !== null && (
                <text
                  ref={el => { deltaRefs.current[i] = el; }}
                  x={(PAD.left + bx - (step - barW) / 2 - 4).toFixed(2)}
                  y={(PAD.top + (barTopY + (i > 0 ? toY(STEPS[i - 1].cost, plotH) : barTopY)) / 2).toFixed(2)}
                  textAnchor="middle"
                  fill={delta < 0 ? tokens.color.cofounderBlue : C.label}
                  fontSize="9"
                  fontWeight="500"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {delta < 0 ? '▼' : '▲'} {fmtPct(Math.abs(deltaPct), 1)}
                </text>
              )}

              {/* X label */}
              <text
                x={(PAD.left + bx + barW / 2).toFixed(2)}
                y={(PAD.top + plotH + 16).toFixed(2)}
                textAnchor="middle"
                fill={isOpt ? C.optimal : C.label}
                fontSize="11"
                fontWeight={isOpt ? '600' : '400'}
              >
                {s.label}
              </text>
              <text
                x={(PAD.left + bx + barW / 2).toFixed(2)}
                y={(PAD.top + plotH + 29).toFixed(2)}
                textAnchor="middle"
                fill={C.label}
                fontSize="9"
                opacity="0.7"
              >
                {s.sublabel}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && tooltip.visible && (
          <g>
            <rect
              x={(tooltip.x + 10).toFixed(2)}
              y={(tooltip.y - 36).toFixed(2)}
              width="148"
              height="58"
              rx="4"
              fill={C.tooltipBg}
              stroke={C.tooltipBdr}
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12)) drop-shadow(0 1px 2px rgba(0,0,0,0.07))' }}
            />
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y - 20).toFixed(2)}
              fill={C.label} fontSize="10">{tooltip.step.label} — {tooltip.step.sublabel}</text>
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y - 5).toFixed(2)}
              fill={tooltip.step.isOptimal ? C.optimal : C.dark}
              fontSize="13" fontWeight="600"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtMoney(tooltip.step.cost)}
            </text>
            {tooltip.step.isOptimal && (
              <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y + 12).toFixed(2)}
                fill={C.optimal} fontSize="9" fontWeight="600">
                ÓPTIMO GLOBAL
              </text>
            )}
          </g>
        )}
      </svg>

      <style>{`
        @keyframes optPulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.55; }
        }
      `}</style>
    </div>
  );
}
