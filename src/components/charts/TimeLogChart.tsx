'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { results, fmtTime } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

const METHODS = ['LP', 'Greedy', 'GA', 'ILP'] as const;
type Method = typeof METHODS[number];

const TIMES: Record<Method, number> = {
  LP: results.comparativa.tiempo_s[0],
  Greedy: results.comparativa.tiempo_s[1],
  GA: results.comparativa.tiempo_s[2],
  ILP: results.comparativa.tiempo_s[3],
};

const LABELS: Record<Method, string> = {
  LP: 'Cota LP',
  Greedy: 'Greedy',
  GA: 'GA (best)',
  ILP: 'Exacto ILP',
};

// GIC light theme — bars: mix of darks + cofounder-blue for GA
const COLORS: Record<Method, string> = {
  LP:     tokens.color.lightGray,       // #b4b8b4
  Greedy: tokens.color.slateGray,       // #444141
  GA:     tokens.color.cofounderBlue,   // #0081c0 — winner accent
  ILP:    tokens.color.darkCharcoal,    // #171717
};

const PAD = { top: 48, right: 64, bottom: 56, left: 68 };
const CHART_H = 340;
const BAR_GAP = 0.3;

const LOG_TICKS = [0.001, 0.01, 0.1, 1, 10, 100, 1000];

// GIC palette constants
const C = {
  grid:      tokens.color.steelGray,    // #dee2de
  tickLabel: tokens.color.mediumGray,   // #646464
  baseline:  tokens.color.steelGray,
  annotLine: tokens.color.cofounderBlue,
  annotText: tokens.color.mediumGray,
  xLabel:    tokens.color.darkCharcoal,
} as const;

function logY(v: number, plotH: number): number {
  if (!Number.isFinite(v) || v <= 0) return plotH;
  const logMin = Math.log10(LOG_TICKS[0]);
  const logMax = Math.log10(LOG_TICKS[LOG_TICKS.length - 1]);
  const logV = Math.log10(Math.max(v, LOG_TICKS[0]));
  return plotH - ((logV - logMin) / (logMax - logMin)) * plotH;
}

function fmtTickLabel(v: number): string {
  if (v < 1) return `${(v * 1000).toFixed(0)}ms`;
  if (v < 60) return `${v}s`;
  return `${(v / 60).toFixed(0)}min`;
}

export default function TimeLogChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<(SVGRectElement | null)[]>([]);
  const [width, setWidth] = useState(700);

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
  const n = METHODS.length;
  const step = plotW / n;
  const barW = step * (1 - BAR_GAP);

  const logMin = Math.log10(LOG_TICKS[0]);
  const logMax = Math.log10(LOG_TICKS[LOG_TICKS.length - 1]);

  useGSAP(
    () => {
      barRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.set(el, {
          scaleY: 0,
          transformOrigin: `${(parseFloat(el.getAttribute('x') ?? '0') + barW / 2).toFixed(2)}px ${(PAD.top + plotH).toFixed(2)}px`,
        });
        ScrollTrigger.create({
          trigger: wrapRef.current,
          start: 'top 80%',
          onEnter: () => {
            gsap.to(el, {
              scaleY: 1,
              duration: 0.8,
              ease: 'back.out(1.4)',
              delay: i * 0.1,
            });
          },
          once: true,
        });
      });
    },
    { scope: wrapRef, dependencies: [width] },
  );

  const ilpIdx = METHODS.indexOf('ILP');
  const ilpX = PAD.left + step * ilpIdx + step * (BAR_GAP / 2);
  const ilpTime = TIMES.ILP;
  const ilpLogY = logY(ilpTime, plotH);
  const ilpBarTop = PAD.top + ilpLogY;

  const gaTime = TIMES.GA;
  const ratio = Number.isFinite(ilpTime) && Number.isFinite(gaTime) && gaTime > 0
    ? ilpTime / gaTime
    : null;

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      <svg
        width={width}
        height={CHART_H + 32}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Comparación de tiempos de ejecución en escala logarítmica"
      >
        {/* Y axis hairlines at log ticks */}
        {LOG_TICKS.map((v) => {
          const lv = Math.log10(v);
          const normY = (lv - logMin) / (logMax - logMin);
          const y = (PAD.top + plotH - normY * plotH).toFixed(2);
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
                {fmtTickLabel(v)}
              </text>
            </g>
          );
        })}

        {/* Y axis label */}
        <text
          x={(PAD.left - 48).toFixed(2)}
          y={(PAD.top + plotH / 2).toFixed(2)}
          fill={C.tickLabel}
          fontSize="11"
          textAnchor="middle"
          transform={`rotate(-90, ${(PAD.left - 48).toFixed(2)}, ${(PAD.top + plotH / 2).toFixed(2)})`}
        >
          Tiempo (escala log)
        </text>

        {/* Baseline */}
        <line
          x1={PAD.left.toFixed(2)}
          y1={(PAD.top + plotH).toFixed(2)}
          x2={(PAD.left + plotW).toFixed(2)}
          y2={(PAD.top + plotH).toFixed(2)}
          stroke={C.baseline}
          strokeWidth="1"
        />

        {/* Bars */}
        {METHODS.map((method, i) => {
          const x = PAD.left + step * i + step * (BAR_GAP / 2);
          const t = TIMES[method];
          const lv = Math.log10(Math.max(t, LOG_TICKS[0]));
          const normY = (lv - logMin) / (logMax - logMin);
          const bH = Math.max(4, normY * plotH);
          const bY = PAD.top + plotH - bH;
          const color = COLORS[method];
          const isGA = method === 'GA';

          return (
            <g key={method}>
              <rect
                ref={(el) => {
                  barRefs.current[i] = el;
                  if (el) {
                    el.setAttribute('data-h', bH.toFixed(2));
                    el.setAttribute('data-y', bY.toFixed(2));
                  }
                }}
                x={x.toFixed(2)}
                y={bY.toFixed(2)}
                width={barW.toFixed(2)}
                height={bH.toFixed(2)}
                fill={color}
                opacity={isGA ? 1 : 0.65}
                rx="2"
                ry="2"
              />
              {/* Value above bar */}
              <text
                x={(x + barW / 2).toFixed(2)}
                y={(bY - 8).toFixed(2)}
                textAnchor="middle"
                fill={color}
                fontSize="11"
                fontWeight={isGA ? '600' : '400'}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {fmtTime(t)}
              </text>
              {/* X label */}
              <text
                x={(x + barW / 2).toFixed(2)}
                y={(PAD.top + plotH + 18).toFixed(2)}
                textAnchor="middle"
                fill={isGA ? tokens.color.cofounderBlue : C.tickLabel}
                fontSize="11"
                fontWeight={isGA ? '600' : '400'}
                opacity={isGA ? 1 : 0.75}
              >
                {LABELS[method]}
              </text>
            </g>
          );
        })}

        {/* ILP annotation arrow */}
        {ratio !== null && Number.isFinite(ratio) && (
          <g>
            <line
              x1={(ilpX + barW + 4).toFixed(2)}
              y1={(ilpBarTop + 12).toFixed(2)}
              x2={(ilpX + barW + 36).toFixed(2)}
              y2={(ilpBarTop + 12).toFixed(2)}
              stroke={C.annotLine}
              strokeWidth="1"
            />
            <polygon
              points={`${(ilpX + barW + 36).toFixed(2)},${(ilpBarTop + 9).toFixed(2)} ${(ilpX + barW + 42).toFixed(2)},${(ilpBarTop + 12).toFixed(2)} ${(ilpX + barW + 36).toFixed(2)},${(ilpBarTop + 15).toFixed(2)}`}
              fill={C.annotLine}
            />
            <text
              x={(ilpX + barW + 46).toFixed(2)}
              y={(ilpBarTop + 8).toFixed(2)}
              fill={C.annotLine}
              fontSize="11"
              fontWeight="500"
            >
              {fmtTime(ilpTime)}
            </text>
            <text
              x={(ilpX + barW + 46).toFixed(2)}
              y={(ilpBarTop + 22).toFixed(2)}
              fill={C.annotText}
              fontSize="10"
            >
              {ratio.toFixed(0)}× del GA
            </text>
          </g>
        )}

        {/* Log scale label */}
        <text
          x={(width - PAD.right).toFixed(2)}
          y={(PAD.top - 10).toFixed(2)}
          fill={C.tickLabel}
          fontSize="10"
          textAnchor="end"
          opacity="0.6"
        >
          escala logarítmica
        </text>
      </svg>
    </div>
  );
}
