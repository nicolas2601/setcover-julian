'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { results, fmtMoney, fmtPct } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

type View = 'cost' | 'vs_lp' | 'vs_ilp';

const METHODS = ['LP', 'Greedy', 'GA', 'ILP'] as const;
type Method = typeof METHODS[number];

const COSTS: Record<Method, number> = {
  LP: results.comparativa.costo[0],
  Greedy: results.comparativa.costo[1],
  GA: results.comparativa.costo[2],
  ILP: results.comparativa.costo[3],
};

// GIC light theme — bars: mix of darks + cofounder-blue for GA winner
const METHOD_COLORS: Record<Method, string> = {
  LP:     tokens.color.lightGray,       // #b4b8b4 — muted
  Greedy: tokens.color.slateGray,       // #444141 — secondary dark
  GA:     tokens.color.cofounderBlue,   // #0081c0 — WINNER accent
  ILP:    tokens.color.darkCharcoal,    // #171717 — exact reference
};

const METHOD_LABELS: Record<Method, string> = {
  LP: 'Cota LP',
  Greedy: 'Greedy',
  GA: 'GA (best)',
  ILP: 'Exacto ILP',
};

const PAD = { top: 48, right: 32, bottom: 56, left: 56 };
const CHART_H = 340;
const BAR_GAP = 0.3;

// GIC palette constants
const C = {
  bg:        'transparent',
  grid:      tokens.color.steelGray,     // #dee2de
  tickLabel: tokens.color.mediumGray,    // #646464
  baseline:  tokens.color.steelGray,     // #dee2de
  xLabel:    tokens.color.darkCharcoal,  // #171717
  pillBdr:   tokens.color.steelGray,     // inactive pill border
} as const;

function getValues(view: View): Record<Method, number> {
  const lp = COSTS.LP;
  const ilp = COSTS.ILP;
  switch (view) {
    case 'vs_lp':
      return {
        LP: 0,
        Greedy: ((COSTS.Greedy - lp) / lp) * 100,
        GA: ((COSTS.GA - lp) / lp) * 100,
        ILP: ((COSTS.ILP - lp) / lp) * 100,
      };
    case 'vs_ilp':
      return {
        LP: ((lp - ilp) / ilp) * 100,
        Greedy: ((COSTS.Greedy - ilp) / ilp) * 100,
        GA: ((COSTS.GA - ilp) / ilp) * 100,
        ILP: 0,
      };
    default:
      return { ...COSTS };
  }
}

function fmtVal(v: number, view: View) {
  if (view === 'cost') return fmtMoney(v);
  if (!Number.isFinite(v)) return '—';
  return fmtPct(v, 1);
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
    const lb = labelRef.current;
    if (!el || !lb) return;
    gsap.fromTo(
      el,
      { scaleY: 0, transformOrigin: 'bottom center' },
      {
        scaleY: 1,
        transformOrigin: 'bottom center',
        duration: 0.7,
        ease: 'back.out(1.4)',
        delay: METHODS.indexOf(method) * 0.1,
      },
    );
    gsap.fromTo(
      lb,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        delay: METHODS.indexOf(method) * 0.1 + 0.3,
      },
    );
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
        opacity={isHighlighted ? 1 : 0.65}
        rx="2"
        ry="2"
      />
      <text
        ref={labelRef}
        x={(x + barW / 2).toFixed(2)}
        y={(barY - 8).toFixed(2)}
        textAnchor="middle"
        fill={color}
        fontSize="11"
        fontWeight={isHighlighted ? '600' : '400'}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {fmtVal(val, view)}
      </text>
    </g>
  );
}

export default function ComparisonBars() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(700);
  const [view, setView] = useState<View>('cost');
  const [animKey, setAnimKey] = useState('init');

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

  const handleViewChange = useCallback((v: View) => {
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
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', paddingLeft: PAD.left }}>
        {([['cost', 'COSTO'], ['vs_lp', '% vs LP'], ['vs_ilp', '% vs ILP']] as [View, string][]).map(
          ([v, label]) => (
            <button
              key={v}
              onClick={() => handleViewChange(v)}
              style={{
                background: view === v ? tokens.color.cofounderBlue : 'transparent',
                border: `1px solid ${view === v ? tokens.color.cofounderBlue : C.pillBdr}`,
                borderRadius: '22px',
                padding: '6px 16px',
                fontSize: '11px',
                color: view === v ? tokens.color.canvasWhite : tokens.color.mediumGray,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                transition: 'border-color 0.2s, color 0.2s, background 0.2s',
              }}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={CHART_H}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Comparación de métodos por costo"
      >
        {/* Y axis hairlines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = i * yStep;
          const y = (PAD.top + plotH - (v / maxVal) * plotH).toFixed(2);
          return (
            <g key={i}>
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
                {view === 'cost'
                  ? v >= 1000
                    ? `${(v / 1000).toFixed(0)}k`
                    : v.toFixed(0)
                  : `${v.toFixed(0)}%`}
              </text>
            </g>
          );
        })}

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

        {/* X labels */}
        {METHODS.map((method, i) => {
          const x = PAD.left + step * i + step / 2;
          const isWinner = method === 'GA';
          return (
            <text
              key={method}
              x={x.toFixed(2)}
              y={(PAD.top + plotH + 18).toFixed(2)}
              textAnchor="middle"
              fill={isWinner ? tokens.color.cofounderBlue : C.tickLabel}
              fontSize="11"
              fontWeight={isWinner ? '600' : '400'}
              opacity={isWinner ? 1 : 0.75}
            >
              {METHOD_LABELS[method]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
