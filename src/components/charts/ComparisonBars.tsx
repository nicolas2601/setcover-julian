'use client';

/**
 * ComparisonBars — Paper-aligned: SOLO GA vs ILP (PLE B&B).
 * Cifras del paper final (resultados_setcover.txt):
 *   ILP: $49,988 / 22 antenas / 600.96 s (IntegerFeasible)
 *   GA:  $50,795 / 23 antenas / 7.23 s   (gap 1.61%, 83× más rápido)
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { results, fmtMoney, fmtTime, fmtPct } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

type View = 'cost' | 'time' | 'gap';

const METHODS = ['ILP', 'GA'] as const;
type Method = typeof METHODS[number];

const ILP_COST = results.exacto.costo;    // 49988
const GA_COST  = results.ga_refinado.costo; // 50795
const ILP_T    = results.exacto.tiempo_s;   // 600.96
const GA_T     = results.ga_refinado.tiempo_s; // 7.23
const GA_GAP   = results.ga_refinado.gap_vs_exacto_pct; // 1.61

const METHOD_COLORS: Record<Method, string> = {
  ILP: tokens.color.darkCharcoal,    // #171717 — reference
  GA:  tokens.color.cofounderBlue,   // #0081c0 — winner
};

const METHOD_LABELS: Record<Method, string> = {
  ILP: 'PLE — ILP (B&B)',
  GA:  'Algoritmo Genético',
};

const METHOD_SUBLABELS: Record<Method, string> = {
  ILP: 'intlinprog · 600.96 s',
  GA:  'parada anticipada · 7.23 s',
};

const PAD = { top: 56, right: 56, bottom: 72, left: 88 };
const CHART_H = 380;
const BAR_GAP = 0.35;

const C = {
  grid:      tokens.color.steelGray,
  tickLabel: tokens.color.mediumGray,
  baseline:  tokens.color.steelGray,
  xLabel:    tokens.color.darkCharcoal,
  pillBdr:   tokens.color.steelGray,
} as const;

function getValues(view: View): Record<Method, number> {
  switch (view) {
    case 'time':
      return { ILP: ILP_T, GA: GA_T };
    case 'gap':
      return { ILP: 0, GA: GA_GAP };
    default:
      return { ILP: ILP_COST, GA: GA_COST };
  }
}

function fmtVal(v: number, view: View) {
  if (view === 'cost') return fmtMoney(v);
  if (view === 'time') return fmtTime(v);
  return fmtPct(v, 2);
}

interface BarProps {
  method: Method;
  val: number;
  maxVal: number;
  x: number;
  barW: number;
  plotH: number;
  view: View;
  animKey: string;
}

function Bar({ method, val, maxVal, x, barW, plotH, view, animKey }: BarProps) {
  const barRef = useRef<SVGRectElement>(null);
  const labelRef = useRef<SVGTextElement>(null);
  const color = METHOD_COLORS[method];
  const isHighlighted = method === 'GA';

  const normVal = maxVal > 0 && Number.isFinite(val) ? Math.abs(val) / maxVal : 0;
  const barH = Math.max(4, normVal * plotH);
  const barY = PAD.top + plotH - barH;

  useEffect(() => {
    const el = barRef.current;
    const lbl = labelRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { scaleY: 0, transformOrigin: 'bottom center' },
      { scaleY: 1, duration: 1.0, ease: 'back.out(1.3)', delay: METHODS.indexOf(method) * 0.15 + 0.2 },
    );
    if (lbl) {
      gsap.fromTo(
        lbl,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.5, delay: METHODS.indexOf(method) * 0.15 + 0.9 },
      );
    }
  }, [animKey, method]);

  return (
    <g>
      <rect
        ref={barRef}
        x={x.toFixed(2)}
        y={barY.toFixed(2)}
        width={barW.toFixed(2)}
        height={barH.toFixed(2)}
        fill={color}
        opacity={isHighlighted ? 1 : 0.85}
        rx="4"
        ry="4"
      />
      <text
        ref={labelRef}
        x={(x + barW / 2).toFixed(2)}
        y={(barY - 14).toFixed(2)}
        textAnchor="middle"
        fontFamily={tokens.font.mono}
        fontSize="20"
        fontWeight="600"
        fill={isHighlighted ? tokens.color.cofounderBlue : tokens.color.darkCharcoal}
      >
        {fmtVal(val, view)}
      </text>
    </g>
  );
}

interface TogglePillProps {
  view: View;
  current: View;
  label: string;
  onClick: (v: View) => void;
}

function TogglePill({ view, current, label, onClick }: TogglePillProps) {
  const active = view === current;
  return (
    <button
      onClick={() => onClick(view)}
      style={{
        padding: '8px 18px',
        borderRadius: 999,
        border: `1px solid ${active ? tokens.color.cofounderBlue : C.pillBdr}`,
        background: active ? tokens.color.cofounderBlue : 'transparent',
        color: active ? tokens.color.canvasWhite : tokens.color.darkCharcoal,
        fontFamily: tokens.font.family,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '-0.012em',
        cursor: 'pointer',
        transition: 'all 240ms cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {label}
    </button>
  );
}

export function ComparisonBars() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);
  const [view, setView] = useState<View>('cost');
  const [animKey, setAnimKey] = useState('initial');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setWidth(Math.max(420, w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(() => { /* ensure GSAP context */ }, { scope: wrapRef });

  const handleView = useCallback((v: View) => {
    setView(v);
    setAnimKey(`${v}-${Date.now()}`);
  }, []);

  const vals = getValues(view);
  const allVals = Object.values(vals).filter(Number.isFinite);
  const maxVal = Math.max(...allVals.map(Math.abs), 1);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = Math.max(0, CHART_H - PAD.top - PAD.bottom);
  const n = METHODS.length;
  const totalGap = BAR_GAP * (n + 1);
  const barW = Math.max(0, (plotW * (1 - totalGap)) / n);
  const step = plotW / n;

  const yTicks = 5;
  const yStep = maxVal / yTicks;

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      {/* Toggle pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, paddingLeft: PAD.left, flexWrap: 'wrap' }}>
        <TogglePill view="cost" current={view} label="COSTO ($)" onClick={handleView} />
        <TogglePill view="time" current={view} label="TIEMPO (s)" onClick={handleView} />
        <TogglePill view="gap"  current={view} label="GAP (%)" onClick={handleView} />
      </div>

      <svg
        width="100%"
        height={CHART_H}
        viewBox={`0 0 ${width} ${CHART_H}`}
        style={{ overflow: 'visible', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis ticks + gridlines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = i * yStep;
          const y = PAD.top + plotH - (val / maxVal) * plotH;
          return (
            <g key={`yt-${i}`}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y}
                y2={y}
                stroke={C.grid}
                strokeWidth="1"
                strokeDasharray={i === 0 ? undefined : '4 6'}
                opacity={i === 0 ? 0.8 : 0.45}
              />
              <text
                x={PAD.left - 12}
                y={y + 4}
                textAnchor="end"
                fontFamily={tokens.font.mono}
                fontSize="11"
                fill={C.tickLabel}
              >
                {fmtVal(val, view)}
              </text>
            </g>
          );
        })}

        {/* Bars + value labels */}
        {METHODS.map((method, i) => {
          const x = PAD.left + step * i + step * (BAR_GAP / 2) + step * BAR_GAP / 2;
          return (
            <Bar
              key={`${animKey}-${method}`}
              method={method}
              val={vals[method]}
              maxVal={maxVal}
              x={x}
              barW={barW}
              plotH={plotH}
              view={view}
              animKey={animKey}
            />
          );
        })}

        {/* X-axis labels (method name + subtitle) */}
        {METHODS.map((method, i) => {
          const x = PAD.left + step * i + step / 2;
          const isHighlighted = method === 'GA';
          return (
            <g key={`xl-${method}`}>
              <text
                x={x.toFixed(2)}
                y={CHART_H - PAD.bottom + 24}
                textAnchor="middle"
                fontFamily={tokens.font.family}
                fontSize="14"
                fontWeight={isHighlighted ? '600' : '500'}
                fill={isHighlighted ? tokens.color.cofounderBlue : C.xLabel}
              >
                {METHOD_LABELS[method]}
              </text>
              <text
                x={x.toFixed(2)}
                y={CHART_H - PAD.bottom + 42}
                textAnchor="middle"
                fontFamily={tokens.font.family}
                fontSize="11"
                fill={tokens.color.mediumGray}
              >
                {METHOD_SUBLABELS[method]}
              </text>
            </g>
          );
        })}
      </svg>

      <div style={{ marginTop: 16, paddingLeft: PAD.left, fontSize: 12, color: tokens.color.mediumGray, fontFamily: tokens.font.family }}>
        Fuente: <em>resultados_setcover.txt</em> · El GA es <strong style={{ color: tokens.color.cofounderBlue }}>83× más rápido</strong> con gap del 1.61 % vs ILP.
      </div>
    </div>
  );
}
export default ComparisonBars;
