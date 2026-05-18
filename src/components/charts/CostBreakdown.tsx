'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SELECTED_EXACT_ANTENNAS, fmtMoney, fmtPct } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

// ─── Synthetic per-antenna costs from LCG (total must = $50,123) ─────────────

function lcgRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

const TOTAL_COST = 50123;
const N = SELECTED_EXACT_ANTENNAS.length; // 22

function buildAntennaCosts(): { id: number; cost: number }[] {
  const rand = lcgRand(99);
  const raw = SELECTED_EXACT_ANTENNAS.map(id => ({ id, raw: 0.3 + rand() * 3.7 }));
  const total = raw.reduce((s, r) => s + r.raw, 0);
  return raw.map(r => ({ id: r.id, cost: Math.round((r.raw / total) * TOTAL_COST) }));
}

const ANTENNA_COSTS = buildAntennaCosts();
const SORTED = [...ANTENNA_COSTS].sort((a, b) => b.cost - a.cost);

// Top 5 vs rest
const TOP5 = SORTED.slice(0, 5);
const REST = SORTED.slice(5);

interface Segment {
  label: string;
  cost: number;
  color: string;
  ids: number[];
}

const SEGMENTS: Segment[] = [
  ...TOP5.map((a, i) => ({
    label: `Ant. #${a.id}`,
    cost: a.cost,
    color: i === 0 ? tokens.color.cofounderBlue : tokens.color.actionAzure,
    ids: [a.id],
  })),
  {
    label: `${REST.length} restantes`,
    cost: REST.reduce((s, a) => s + a.cost, 0),
    color: tokens.color.steelGray,
    ids: REST.map(a => a.id),
  },
];

const BAR_H = 40;
const PAD = { top: 32, right: 32, bottom: 40, left: 110 };
const CHART_H = PAD.top + BAR_H + 64 + SEGMENTS.length * 36;

const C = {
  grid:       tokens.color.steelGray,
  label:      tokens.color.mediumGray,
  dark:       tokens.color.darkCharcoal,
  tooltipBg:  tokens.color.canvasWhite,
  tooltipBdr: tokens.color.steelGray,
} as const;

interface TooltipState {
  x: number;
  y: number;
  seg: Segment;
  visible: boolean;
}

export default function CostBreakdown() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef<(SVGRectElement | null)[]>([]);
  const [width, setWidth] = useState(640);
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
    setWidth(el.getBoundingClientRect().width || 640);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - PAD.left - PAD.right);

  // ── Calculate segment x positions ─────────────────────────────────────────

  let cursor = 0;
  const segGeom = SEGMENTS.map(seg => {
    const pct = seg.cost / TOTAL_COST;
    const w = pct * plotW;
    const x = cursor;
    cursor += w;
    return { pct, w, x };
  });

  // ── GSAP grow animation ────────────────────────────────────────────────────

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top 80%',
        once: true,
      },
    });

    segRefs.current.forEach((el, i) => {
      if (!el) return;
      const finalW = Number(el.getAttribute('data-w') ?? 0);
      gsap.set(el, { attr: { width: 0 } });
      tl.to(el, {
        attr: { width: finalW.toFixed(2) },
        duration: 0.7,
        ease: 'power3.out',
        delay: i * 0.08,
      }, 0);
    });
  }, { scope: wrapRef, dependencies: [width] });

  const handleEnter = useCallback((seg: Segment, idx: number, x: number, svgY: number) => {
    setTooltip({ x: x + PAD.left, y: svgY, seg, visible: true });
    setHovIdx(idx);
  }, []);

  const handleLeave = useCallback(() => {
    setTooltip(null);
    setHovIdx(null);
  }, []);

  const barY = PAD.top;

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      <svg
        width={width}
        height={CHART_H}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Desglose de costo total por antena"
      >
        {/* Total label */}
        <text x={PAD.left.toFixed(2)} y={(barY - 10).toFixed(2)}
          fill={C.dark} fontSize="11" fontWeight="500"
          style={{ fontVariantNumeric: 'tabular-nums' }}>
          Costo total: {fmtMoney(TOTAL_COST)}
        </text>

        {/* Stacked bar */}
        {SEGMENTS.map((seg, i) => {
          const g = segGeom[i];
          const isHov = hovIdx === i;
          return (
            <g key={seg.label}>
              <rect
                ref={el => { segRefs.current[i] = el; }}
                data-w={g.w.toFixed(2)}
                x={(PAD.left + g.x).toFixed(2)}
                y={barY.toFixed(2)}
                width="0"
                height={BAR_H.toFixed(2)}
                fill={seg.color}
                opacity={isHov ? 1 : (i === SEGMENTS.length - 1 ? 0.5 : 0.85)}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => handleEnter(seg, i, g.x + g.w / 2, barY + BAR_H / 2)}
                onMouseLeave={handleLeave}
              />
              {/* Divider between segments */}
              {i > 0 && (
                <line
                  x1={(PAD.left + g.x).toFixed(2)}
                  y1={barY.toFixed(2)}
                  x2={(PAD.left + g.x).toFixed(2)}
                  y2={(barY + BAR_H).toFixed(2)}
                  stroke={tokens.color.canvasWhite}
                  strokeWidth="1"
                  opacity="0.6"
                />
              )}
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={PAD.left.toFixed(2)}
          y1={(barY + BAR_H).toFixed(2)}
          x2={(PAD.left + plotW).toFixed(2)}
          y2={(barY + BAR_H).toFixed(2)}
          stroke={C.grid}
          strokeWidth="1"
        />

        {/* Legend rows */}
        {SEGMENTS.map((seg, i) => {
          const g = segGeom[i];
          const rowY = barY + BAR_H + 28 + i * 36;
          return (
            <g key={`leg-${i}`}>
              {/* Connector tick */}
              <line
                x1={(PAD.left + g.x + g.w / 2).toFixed(2)}
                y1={(barY + BAR_H).toFixed(2)}
                x2={(PAD.left + g.x + g.w / 2).toFixed(2)}
                y2={(barY + BAR_H + 10).toFixed(2)}
                stroke={seg.color}
                strokeWidth="1"
                opacity="0.5"
              />
              {/* Color swatch */}
              <rect
                x={PAD.left.toFixed(2)}
                y={(rowY - 5).toFixed(2)}
                width="10"
                height="10"
                rx="2"
                fill={seg.color}
                opacity={i === SEGMENTS.length - 1 ? 0.5 : 0.85}
              />
              {/* Antenna label */}
              <text x={(PAD.left + 16).toFixed(2)} y={rowY.toFixed(2)}
                fill={C.dark} fontSize="11"
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {seg.label}
              </text>
              {/* Cost */}
              <text x={(PAD.left + plotW).toFixed(2)} y={rowY.toFixed(2)}
                textAnchor="end" fill={i < 5 ? seg.color : C.label} fontSize="11"
                fontWeight={i < 5 ? '500' : '400'}
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmtMoney(seg.cost)}
              </text>
              {/* Pct */}
              <text x={(PAD.left + plotW - 80).toFixed(2)} y={rowY.toFixed(2)}
                textAnchor="end" fill={C.label} fontSize="10"
                style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmtPct((seg.cost / TOTAL_COST) * 100, 1)}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && tooltip.visible && (
          <g>
            <rect
              x={(tooltip.x + 8).toFixed(2)}
              y={(tooltip.y - 30).toFixed(2)}
              width="140"
              height="56"
              rx="4"
              fill={C.tooltipBg}
              stroke={C.tooltipBdr}
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}
            />
            <text x={(tooltip.x + 14).toFixed(2)} y={(tooltip.y - 14).toFixed(2)}
              fill={C.label} fontSize="10">{tooltip.seg.label}</text>
            <text x={(tooltip.x + 14).toFixed(2)} y={(tooltip.y + 1).toFixed(2)}
              fill={C.dark} fontSize="12" fontWeight="500"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtMoney(tooltip.seg.cost)}
            </text>
            <text x={(tooltip.x + 14).toFixed(2)} y={(tooltip.y + 16).toFixed(2)}
              fill={C.label} fontSize="10">
              {fmtPct((tooltip.seg.cost / TOTAL_COST) * 100, 1)} del total
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
