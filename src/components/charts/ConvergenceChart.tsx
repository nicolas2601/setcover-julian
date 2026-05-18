'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { syntheticConvergence, fmtMoney } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

const DATA = syntheticConvergence(500);
const PAD = { top: 32, right: 90, bottom: 48, left: 68 };
const HEIGHT = 480;
const Y_MIN = 50000;
const Y_MAX = 80000;
const Y_TICKS = [50000, 60000, 70000, 80000];
const X_TICKS = [100, 200, 300, 400, 500];
const ILP_COST = 50123;
const GREEDY_COST = 52063;

function toSVGY(v: number, h: number) {
  const plotH = h - PAD.top - PAD.bottom;
  return PAD.top + plotH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * plotH;
}

function buildPath(
  pts: { gen: number; val: number }[],
  w: number,
  h: number,
): string {
  if (pts.length === 0) return '';
  const plotW = w - PAD.left - PAD.right;
  const plotH = h - PAD.top - PAD.bottom;
  return pts
    .map((p, i) => {
      const x = (PAD.left + ((p.gen - 1) / 499) * plotW).toFixed(2);
      const y = (PAD.top + plotH - ((p.val - Y_MIN) / (Y_MAX - Y_MIN)) * plotH).toFixed(2);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

interface TooltipState {
  x: number;
  y: number;
  gen: number;
  best: number;
  avg: number;
  visible: boolean;
}

export default function ConvergenceChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const bestPathRef = useRef<SVGPathElement>(null);
  const avgPathRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(800);
  const [scrubGen, setScrubGen] = useState(499);
  const [tooltip, setTooltip] = useState<TooltipState>({
    x: 0, y: 0, gen: 0, best: 0, avg: 0, visible: false,
  });

  // ResizeObserver
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && Number.isFinite(w)) setWidth(w);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || 800);
    return () => ro.disconnect();
  }, []);

  // Build paths
  const bestPts = DATA.map((d) => ({ gen: d.gen, val: d.best }));
  const avgPts = DATA.map((d) => ({ gen: d.gen, val: d.avg }));
  const bestD = buildPath(bestPts, width, HEIGHT);
  const avgD = buildPath(avgPts, width, HEIGHT);

  // GSAP scroll-linked draw
  useGSAP(() => {
    const bestEl = bestPathRef.current;
    const avgEl = avgPathRef.current;
    if (!bestEl || !avgEl || !wrapRef.current) return;

    const bestLen = bestEl.getTotalLength();
    const avgLen = avgEl.getTotalLength();

    gsap.set(bestEl, { strokeDasharray: bestLen, strokeDashoffset: bestLen });
    gsap.set(avgEl, { strokeDasharray: avgLen, strokeDashoffset: avgLen });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top 80%',
        end: 'bottom 40%',
        scrub: 1.2,
      },
    });
    tl.to(bestEl, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);
    tl.to(avgEl, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0);
  }, { scope: wrapRef, dependencies: [width, bestD, avgD] });

  // Scrubber tooltip
  const plotW = width - PAD.left - PAD.right;
  const scrubX = PAD.left + (scrubGen / 499) * plotW;
  const scrubData = DATA[scrubGen] ?? DATA[0];
  const scrubBestY = Number.isFinite(scrubData.best)
    ? toSVGY(scrubData.best, HEIGHT)
    : PAD.top;
  const scrubAvgY = Number.isFinite(scrubData.avg)
    ? toSVGY(scrubData.avg, HEIGHT)
    : PAD.top;

  // SVG hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const rawGen = Math.round(((mx - PAD.left) / plotW) * 499);
      const gen = Math.max(0, Math.min(499, rawGen));
      const d = DATA[gen];
      if (!d) return;
      const x = PAD.left + (gen / 499) * plotW;
      const y = toSVGY(d.best, HEIGHT);
      setTooltip({ x, y, gen: d.gen, best: d.best, avg: d.avg, visible: true });
    },
    [plotW],
  );
  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  // Reference Y positions
  const ilpY = toSVGY(ILP_COST, HEIGHT);
  const greedyY = toSVGY(GREEDY_COST, HEIGHT);

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      <svg
        ref={svgRef}
        width={width}
        height={HEIGHT}
        style={{ display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        aria-label="Curva de convergencia del algoritmo genético"
      >
        {/* BG */}
        <rect width={width} height={HEIGHT} fill={tokens.color.studioBlack} />

        {/* Y grid + ticks */}
        {Y_TICKS.map((v) => {
          const y = toSVGY(v, HEIGHT).toFixed(2);
          return (
            <g key={v}>
              <line
                x1={PAD.left.toFixed(2)}
                y1={y}
                x2={(width - PAD.right).toFixed(2)}
                y2={y}
                stroke={tokens.color.corkShadow}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={(PAD.left - 8).toFixed(2)}
                y={y}
                fill={tokens.color.greyBrown}
                fontSize="10"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {v >= 1000 ? `${v / 1000}k` : v}
              </text>
            </g>
          );
        })}

        {/* X ticks */}
        {X_TICKS.map((v) => {
          const x = (PAD.left + ((v - 1) / 499) * plotW).toFixed(2);
          const yBottom = (PAD.top + HEIGHT - PAD.top - PAD.bottom).toFixed(2);
          return (
            <g key={v}>
              <line
                x1={x}
                y1={yBottom}
                x2={x}
                y2={(parseFloat(yBottom) + 4).toFixed(2)}
                stroke={tokens.color.corkShadow}
                strokeWidth="1"
              />
              <text
                x={x}
                y={(parseFloat(yBottom) + 14).toFixed(2)}
                fill={tokens.color.greyBrown}
                fontSize="10"
                textAnchor="middle"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* X axis line */}
        <line
          x1={PAD.left.toFixed(2)}
          y1={(PAD.top + HEIGHT - PAD.top - PAD.bottom).toFixed(2)}
          x2={(width - PAD.right).toFixed(2)}
          y2={(PAD.top + HEIGHT - PAD.top - PAD.bottom).toFixed(2)}
          stroke={tokens.color.corkShadow}
          strokeWidth="1"
        />

        {/* ILP reference line */}
        <line
          x1={PAD.left.toFixed(2)}
          y1={ilpY.toFixed(2)}
          x2={(width - PAD.right).toFixed(2)}
          y2={ilpY.toFixed(2)}
          stroke={tokens.color.burntSienna}
          strokeWidth="1"
          strokeDasharray="6 4"
          opacity="0.6"
        />
        <text
          x={(width - PAD.right + 6).toFixed(2)}
          y={ilpY.toFixed(2)}
          fill={tokens.color.burntSienna}
          fontSize="10"
          dominantBaseline="middle"
        >
          ILP {fmtMoney(ILP_COST)}
        </text>

        {/* Greedy reference line */}
        <line
          x1={PAD.left.toFixed(2)}
          y1={greedyY.toFixed(2)}
          x2={(width - PAD.right).toFixed(2)}
          y2={greedyY.toFixed(2)}
          stroke={tokens.color.greyBrown}
          strokeWidth="1"
          strokeDasharray="6 4"
          opacity="0.5"
        />
        <text
          x={(width - PAD.right + 6).toFixed(2)}
          y={greedyY.toFixed(2)}
          fill={tokens.color.greyBrown}
          fontSize="10"
          dominantBaseline="middle"
        >
          Greedy {fmtMoney(GREEDY_COST)}
        </text>

        {/* Avg path (dashed cream) */}
        <path
          ref={avgPathRef}
          d={avgD}
          fill="none"
          stroke={tokens.color.warmCream}
          strokeWidth="1"
          strokeDasharray="5 4"
          opacity="0.5"
        />

        {/* Best path (burnt sienna) */}
        <path
          ref={bestPathRef}
          d={bestD}
          fill="none"
          stroke={tokens.color.burntSienna}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Scrubber vertical line */}
        <line
          x1={scrubX.toFixed(2)}
          y1={PAD.top.toFixed(2)}
          x2={scrubX.toFixed(2)}
          y2={(PAD.top + HEIGHT - PAD.top - PAD.bottom).toFixed(2)}
          stroke={tokens.color.warmCream}
          strokeWidth="1"
          opacity="0.4"
          strokeDasharray="3 3"
        />
        <circle
          cx={scrubX.toFixed(2)}
          cy={scrubBestY.toFixed(2)}
          r="4"
          fill={tokens.color.burntSienna}
        />
        <circle
          cx={scrubX.toFixed(2)}
          cy={scrubAvgY.toFixed(2)}
          r="3"
          fill={tokens.color.warmCream}
          opacity="0.6"
        />

        {/* Hover tooltip */}
        {tooltip.visible && Number.isFinite(tooltip.x) && (
          <g>
            <line
              x1={tooltip.x.toFixed(2)}
              y1={PAD.top.toFixed(2)}
              x2={tooltip.x.toFixed(2)}
              y2={(PAD.top + HEIGHT - PAD.top - PAD.bottom).toFixed(2)}
              stroke={tokens.color.warmCream}
              strokeWidth="1"
              opacity="0.3"
            />
            <rect
              x={(tooltip.x + 8).toFixed(2)}
              y={(tooltip.y - 36).toFixed(2)}
              width="110"
              height="56"
              rx="4"
              fill={tokens.color.darkCork}
              stroke={tokens.color.corkShadow}
              strokeWidth="1"
            />
            <text
              x={(tooltip.x + 14).toFixed(2)}
              y={(tooltip.y - 22).toFixed(2)}
              fill={tokens.color.greyBrown}
              fontSize="10"
            >
              Gen {tooltip.gen}
            </text>
            <text
              x={(tooltip.x + 14).toFixed(2)}
              y={(tooltip.y - 8).toFixed(2)}
              fill={tokens.color.burntSienna}
              fontSize="10"
            >
              Mejor: {fmtMoney(tooltip.best)}
            </text>
            <text
              x={(tooltip.x + 14).toFixed(2)}
              y={(tooltip.y + 8).toFixed(2)}
              fill={tokens.color.warmCream}
              fontSize="10"
              opacity="0.7"
            >
              Prom: {fmtMoney(tooltip.avg)}
            </text>
          </g>
        )}

        {/* Legend */}
        <g transform={`translate(${PAD.left.toFixed(2)}, ${(PAD.top - 20).toFixed(2)})`}>
          <line x1="0" y1="0" x2="18" y2="0" stroke={tokens.color.burntSienna} strokeWidth="2" />
          <text x="22" y="0" fill={tokens.color.warmCream} fontSize="10" dominantBaseline="middle">
            Mejor individuo
          </text>
          <line x1="100" y1="0" x2="118" y2="0" stroke={tokens.color.warmCream} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
          <text x="122" y="0" fill={tokens.color.warmCream} fontSize="10" dominantBaseline="middle" opacity="0.7">
            Promedio
          </text>
        </g>
      </svg>

      {/* Scrubber slider */}
      <div
        style={{
          padding: `8px ${PAD.right}px 0 ${PAD.left}px`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '10px', color: tokens.color.greyBrown, minWidth: '60px' }}>
          Gen {scrubData.gen}
        </span>
        <input
          type="range"
          min={0}
          max={499}
          value={scrubGen}
          onChange={(e) => setScrubGen(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: tokens.color.burntSienna,
            cursor: 'pointer',
          }}
          aria-label="Navegar por generaciones"
        />
        <span
          style={{
            fontSize: '10px',
            color: tokens.color.warmCream,
            minWidth: '80px',
            textAlign: 'right',
          }}
        >
          {fmtMoney(scrubData.best)}
        </span>
      </div>

      {/* Caption */}
      <p
        style={{
          padding: `8px ${PAD.right}px 0 ${PAD.left}px`,
          fontSize: '10px',
          color: tokens.color.greyBrown,
          lineHeight: 1.4,
          margin: 0,
        }}
      >
        Curva de convergencia — AG refinado (500 gen, pop 150, seed 13).
        Línea continua: mejor individuo. Línea punteada: promedio de la población.
      </p>
    </div>
  );
}
