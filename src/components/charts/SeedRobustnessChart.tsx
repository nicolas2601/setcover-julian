'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { results, fmtMoney, fmtPct } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

const PAD = { top: 48, right: 140, bottom: 56, left: 68 };
const CHART_H = 340;
const DOT_R_FINAL = 8;

const SEED_COSTS = results.ga.corridas_5_semillas ?? [50572, 50546, 50546, 52063, 51403];
const MU = results.ga.media_5_corridas ?? 51026;
const SIGMA = results.ga.std_5_corridas ?? 613.9;
const ILP_COST = results.exacto.costo;

const SEEDS = SEED_COSTS.map((cost, i) => ({
  seed: i + 1,
  cost,
  isOutlier: i === 3,
}));

const CV = Number.isFinite(MU) && MU > 0 ? (SIGMA / MU) * 100 : 0;

const Y_MIN = 49000;
const Y_MAX = 53000;

function toY(v: number, plotH: number): number {
  return plotH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
}

const Y_TICKS = [49000, 50000, 51000, 52000, 53000];

// GIC light theme
const C = {
  grid:       tokens.color.steelGray,     // #dee2de
  tickLabel:  tokens.color.mediumGray,    // #646464
  sigma:      tokens.color.steelGray,     // sigma band fill — steel gray tint
  refILP:     tokens.color.mediumGray,    // #646464 dashed ref
  muLine:     tokens.color.slateGray,     // #444141 dashed mu
  dotNormal:  tokens.color.cofounderBlue, // #0081c0 — normal seeds
  dotOutlier: tokens.color.slateGray,     // #444141 — worst seed (open circle)
  tooltipBg:  tokens.color.canvasWhite,
  tooltipBdr: tokens.color.steelGray,
  annotation: tokens.color.mediumGray,
} as const;

interface TooltipState {
  x: number;
  y: number;
  seed: number;
  cost: number;
  gap: number;
  visible: boolean;
}

export default function SeedRobustnessChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const [width, setWidth] = useState(700);
  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0, y: 0, seed: 0, cost: 0, gap: 0, visible: false,
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && Number.isFinite(w)) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || 700);
    return () => ro.disconnect();
  }, []);

  const plotW = width - PAD.left - PAD.right;
  const plotH = CHART_H - PAD.top - PAD.bottom;
  const n = SEEDS.length;
  const step = plotW / (n + 1);

  useGSAP(
    () => {
      dotRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(
          el,
          { attr: { r: 0 } },
          {
            attr: { r: DOT_R_FINAL },
            duration: 0.6,
            ease: 'back.out(1.6)',
            delay: i * 0.12,
            scrollTrigger: {
              trigger: wrapRef.current,
              start: 'top 80%',
              once: true,
            },
          },
        );
      });
    },
    { scope: wrapRef, dependencies: [width] },
  );

  const muY = PAD.top + toY(MU, plotH);
  const sigmaTopY = PAD.top + toY(MU + SIGMA, plotH);
  const sigmaBottomY = PAD.top + toY(MU - SIGMA, plotH);
  const bandH = sigmaBottomY - sigmaTopY;

  const handleDotEnter = useCallback(
    (seed: number, cost: number, x: number, y: number) => {
      const gap = Number.isFinite(ILP_COST) && ILP_COST > 0
        ? ((cost - ILP_COST) / ILP_COST) * 100
        : 0;
      setTooltip({ x, y, seed, cost, gap, visible: true });
    },
    [],
  );
  const handleDotLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      <svg
        width={width}
        height={CHART_H}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Robustez por semilla del AG"
      >
        {/* Sigma band — steel gray tint */}
        {Number.isFinite(bandH) && bandH > 0 && (
          <rect
            x={PAD.left.toFixed(2)}
            y={sigmaTopY.toFixed(2)}
            width={plotW.toFixed(2)}
            height={bandH.toFixed(2)}
            fill={C.sigma}
            opacity="0.25"
            rx="2"
          />
        )}

        {/* Y ticks and grid */}
        {Y_TICKS.map((v) => {
          const y = (PAD.top + toY(v, plotH)).toFixed(2);
          return (
            <g key={v}>
              <line
                x1={PAD.left.toFixed(2)}
                y1={y}
                x2={(PAD.left + plotW).toFixed(2)}
                y2={y}
                stroke={C.grid}
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={(PAD.left - 6).toFixed(2)}
                y={y}
                fill={C.tickLabel}
                fontSize="11"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {(v / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* ILP reference */}
        {Number.isFinite(ILP_COST) && (
          <g>
            <line
              x1={PAD.left.toFixed(2)}
              y1={(PAD.top + toY(ILP_COST, plotH)).toFixed(2)}
              x2={(PAD.left + plotW).toFixed(2)}
              y2={(PAD.top + toY(ILP_COST, plotH)).toFixed(2)}
              stroke={C.refILP}
              strokeWidth="1"
              strokeDasharray="6 4"
              opacity="0.6"
            />
            <text
              x={(PAD.left + plotW + 6).toFixed(2)}
              y={(PAD.top + toY(ILP_COST, plotH)).toFixed(2)}
              fill={C.refILP}
              fontSize="10"
              dominantBaseline="middle"
            >
              ILP
            </text>
          </g>
        )}

        {/* Mu dashed line */}
        {Number.isFinite(muY) && (
          <g>
            <line
              x1={PAD.left.toFixed(2)}
              y1={muY.toFixed(2)}
              x2={(PAD.left + plotW).toFixed(2)}
              y2={muY.toFixed(2)}
              stroke={C.muLine}
              strokeWidth="1"
              strokeDasharray="8 4"
              opacity="0.5"
            />
            <text
              x={(PAD.left + plotW + 6).toFixed(2)}
              y={muY.toFixed(2)}
              fill={C.muLine}
              fontSize="10"
              dominantBaseline="middle"
              opacity="0.7"
            >
              μ
            </text>
          </g>
        )}

        {/* Dots */}
        {SEEDS.map((s, i) => {
          const x = PAD.left + step * (i + 1);
          const y = PAD.top + toY(s.cost, plotH);
          const color = s.isOutlier ? C.dotOutlier : C.dotNormal;

          return (
            <g key={s.seed}>
              <circle
                ref={(el) => { dotRefs.current[i] = el; }}
                cx={x.toFixed(2)}
                cy={y.toFixed(2)}
                r="0"
                fill={s.isOutlier ? 'none' : color}
                stroke={color}
                strokeWidth={s.isOutlier ? 2 : 1}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => handleDotEnter(s.seed, s.cost, x, y)}
                onMouseLeave={handleDotLeave}
              />
              <text
                x={x.toFixed(2)}
                y={(y + 20).toFixed(2)}
                textAnchor="middle"
                fill={C.tickLabel}
                fontSize="10"
              >
                s{s.seed}
              </text>
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip.visible && Number.isFinite(tooltip.x) && (
          <g>
            <rect
              x={(tooltip.x + 12).toFixed(2)}
              y={(tooltip.y - 44).toFixed(2)}
              width="128"
              height="64"
              rx="4"
              fill={C.tooltipBg}
              stroke={C.tooltipBdr}
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.10)) drop-shadow(0 1px 2px rgba(0,0,0,0.06))' }}
            />
            <text
              x={(tooltip.x + 18).toFixed(2)}
              y={(tooltip.y - 30).toFixed(2)}
              fill={C.tickLabel}
              fontSize="11"
            >
              Semilla {tooltip.seed}
            </text>
            <text
              x={(tooltip.x + 18).toFixed(2)}
              y={(tooltip.y - 16).toFixed(2)}
              fill={tokens.color.darkCharcoal}
              fontSize="11"
              fontWeight="500"
            >
              {fmtMoney(tooltip.cost)}
            </text>
            <text
              x={(tooltip.x + 18).toFixed(2)}
              y={(tooltip.y).toFixed(2)}
              fill={C.tickLabel}
              fontSize="10"
            >
              Gap ILP: +{fmtPct(tooltip.gap, 2)}
            </text>
          </g>
        )}

        {/* Right annotations: mu / sigma / CV */}
        <g transform={`translate(${(width - PAD.right + 20).toFixed(2)}, ${PAD.top.toFixed(2)})`}>
          <text y="0" fill={C.annotation} fontSize="10">
            μ = {fmtMoney(MU)}
          </text>
          <text y="16" fill={C.annotation} fontSize="10">
            σ = {Math.round(SIGMA).toLocaleString('es-CO')}
          </text>
          <text y="32" fill={C.annotation} fontSize="10">
            CV = {fmtPct(CV, 1)}
          </text>
        </g>

        {/* Baseline */}
        <line
          x1={PAD.left.toFixed(2)}
          y1={(PAD.top + plotH).toFixed(2)}
          x2={(PAD.left + plotW).toFixed(2)}
          y2={(PAD.top + plotH).toFixed(2)}
          stroke={C.grid}
          strokeWidth="1"
        />
      </svg>

      {/* Caption */}
      <p
        style={{
          padding: `8px ${PAD.right}px 0 ${PAD.left}px`,
          fontSize: '11px',
          color: C.tickLabel,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        5 corridas con semillas distintas. Banda gris = ±1σ. Dot vacío (semilla 4) = caso peor.
        Outlier {fmtMoney(SEED_COSTS[3])} detectado.
      </p>
    </div>
  );
}
