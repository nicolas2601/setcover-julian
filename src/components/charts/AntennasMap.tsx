'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SELECTED_EXACT_ANTENNAS, fmtMoney } from '@/lib/results';
import { tokens } from '@/lib/tokens';

gsap.registerPlugin(ScrollTrigger);

// ─── LCG ─────────────────────────────────────────────────────────────────────

function lcgRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Generate deterministic antenna positions (500 antennas) ─────────────────

interface Antenna {
  id: number;
  x: number;
  y: number;
  selected: boolean;
  cost: number;
}

function buildAntennas(w: number, h: number): Antenna[] {
  const pad = 24;
  const rand = lcgRand(42);
  const costRand = lcgRand(99);
  const selectedSet = new Set(SELECTED_EXACT_ANTENNAS);
  return Array.from({ length: 500 }, (_, i) => ({
    id: i,
    x: pad + rand() * (w - pad * 2),
    y: pad + rand() * (h - pad * 2),
    selected: selectedSet.has(i),
    cost: Math.round(costRand() * 4000 + 800),
  }));
}

// ─── Coverage lines: each selected antenna → 3 nearby "client" dots ──────────

function buildCoverageClients(antennas: Antenna[], w: number, h: number): { ax: number; ay: number; cx: number; cy: number; aid: number }[] {
  const pad = 24;
  const rand = lcgRand(17);
  const result: { ax: number; ay: number; cx: number; cy: number; aid: number }[] = [];
  antennas.filter(a => a.selected).forEach(a => {
    for (let k = 0; k < 3; k++) {
      const angle = rand() * Math.PI * 2;
      const dist = 28 + rand() * 52;
      const cx = Math.max(pad, Math.min(w - pad, a.x + Math.cos(angle) * dist));
      const cy = Math.max(pad, Math.min(h - pad, a.y + Math.sin(angle) * dist));
      result.push({ ax: a.x, ay: a.y, cx, cy, aid: a.id });
    }
  });
  return result;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  selected:    tokens.color.cofounderBlue,   // #0081c0
  unselected:  tokens.color.steelGray,       // #dee2de
  coverLine:   tokens.color.actionAzure,     // #41a1cf
  clientDot:   tokens.color.actionAzure,
  grid:        tokens.color.steelGray,
  tooltipBg:   tokens.color.canvasWhite,
  tooltipBdr:  tokens.color.steelGray,
  tooltipText: tokens.color.darkCharcoal,
  label:       tokens.color.mediumGray,
} as const;

interface TooltipState {
  x: number;
  y: number;
  id: number;
  cost: number;
  visible: boolean;
}

interface Props {
  width?: number;
  height?: number;
}

export default function AntennasMap({ width = 600, height = 480 }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const selectedRefs = useRef<(SVGCircleElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const clientRefs = useRef<(SVGCircleElement | null)[]>([]);
  const [containerW, setContainerW] = useState(width);
  const [tooltip, setTooltip] = useState<TooltipState>({ x: 0, y: 0, id: 0, cost: 0, visible: false });
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width;
      if (w && Number.isFinite(w)) setContainerW(Math.min(w, width));
    });
    ro.observe(el);
    setContainerW(Math.min(el.getBoundingClientRect().width || width, width));
    return () => ro.disconnect();
  }, [width]);

  const scale = containerW / width;
  const svgW = containerW;
  const svgH = height * scale;

  const antennas = buildAntennas(width, height);
  const coverage = buildCoverageClients(antennas, width, height);
  const selected = antennas.filter(a => a.selected);
  const unselected = antennas.filter(a => !a.selected);

  // ── GSAP draw-in on scroll ────────────────────────────────────────────────

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapRef.current,
        start: 'top 80%',
        end: 'bottom 40%',
        once: true,
      },
    });

    // Coverage lines draw in first
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const len = Number(el.getAttribute('data-len') ?? 60);
      gsap.set(el, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
      tl.to(el, {
        strokeDashoffset: 0,
        opacity: 0.35,
        duration: 0.5,
        ease: 'power2.out',
        delay: i * 0.015,
      }, 0.1);
    });

    // Client dots
    clientRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { attr: { r: 0 }, opacity: 0 });
      tl.to(el, {
        attr: { r: 2.5 },
        opacity: 0.7,
        duration: 0.3,
        ease: 'back.out(1.4)',
        delay: 0.1 + i * 0.012,
      }, 0.2);
    });

    // Selected antennas appear with bounce
    selectedRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { attr: { r: 0 } });
      tl.to(el, {
        attr: { r: 6 },
        duration: 0.5,
        ease: 'back.out(1.6)',
        delay: i * 0.04,
      }, 0.5);
    });
  }, { scope: wrapRef, dependencies: [svgW, svgH] });

  const handleEnter = useCallback((a: Antenna, evX: number, evY: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ x: a.x * scale, y: a.y * scale, id: a.id, cost: a.cost, visible: true });
    setHoveredId(a.id);
  }, [scale]);

  const handleLeave = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }));
    setHoveredId(null);
  }, []);

  // Grid lines (background)
  const GRID_LINES = 6;

  return (
    <div ref={wrapRef} style={{ width: '100%', fontFamily: tokens.font.family }}>
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Mapa de antenas seleccionadas por ILP"
      >
        {/* Background grid */}
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const xPos = (i / GRID_LINES) * width;
          const yPos = (i / GRID_LINES) * height;
          return (
            <g key={i}>
              <line x1={xPos.toFixed(2)} y1="0" x2={xPos.toFixed(2)} y2={height}
                stroke={C.grid} strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />
              <line x1="0" y1={yPos.toFixed(2)} x2={width} y2={yPos.toFixed(2)}
                stroke={C.grid} strokeWidth="0.5" strokeDasharray="3 6" opacity="0.3" />
            </g>
          );
        })}

        {/* Unselected antennas */}
        {unselected.map(a => (
          <circle
            key={a.id}
            cx={a.x.toFixed(2)}
            cy={a.y.toFixed(2)}
            r="2.5"
            fill={C.unselected}
            opacity="0.28"
          />
        ))}

        {/* Coverage lines */}
        {coverage.map((c, i) => {
          const len = Math.hypot(c.cx - c.ax, c.cy - c.ay);
          return (
            <line
              key={i}
              ref={el => { lineRefs.current[i] = el; }}
              data-len={len.toFixed(2)}
              x1={c.ax.toFixed(2)}
              y1={c.ay.toFixed(2)}
              x2={c.cx.toFixed(2)}
              y2={c.cy.toFixed(2)}
              stroke={C.coverLine}
              strokeWidth="0.8"
              opacity="0"
            />
          );
        })}

        {/* Client dots */}
        {coverage.map((c, i) => (
          <circle
            key={`client-${i}`}
            ref={el => { clientRefs.current[i] = el; }}
            cx={c.cx.toFixed(2)}
            cy={c.cy.toFixed(2)}
            r="0"
            fill={C.clientDot}
            opacity="0"
          />
        ))}

        {/* Selected antennas — on top with pulse ring */}
        {selected.map((a, i) => {
          const isHov = hoveredId === a.id;
          return (
            <g key={a.id}>
              {/* Pulse ring */}
              <circle
                cx={a.x.toFixed(2)}
                cy={a.y.toFixed(2)}
                r="12"
                fill="none"
                stroke={C.selected}
                strokeWidth="1"
                opacity="0.2"
                style={{
                  animation: `antPulse ${1.8 + (i % 5) * 0.2}s ease-out infinite`,
                  transformOrigin: `${a.x.toFixed(2)}px ${a.y.toFixed(2)}px`,
                }}
              />
              <circle
                ref={el => { selectedRefs.current[i] = el; }}
                cx={a.x.toFixed(2)}
                cy={a.y.toFixed(2)}
                r="0"
                fill={C.selected}
                stroke={tokens.color.canvasWhite}
                strokeWidth="1.5"
                opacity={isHov ? 1 : 0.9}
                style={{ cursor: 'pointer', filter: isHov ? `drop-shadow(0 0 6px ${C.selected})` : 'none' }}
                onMouseEnter={e => handleEnter(a, e.clientX, e.clientY)}
                onMouseLeave={handleLeave}
              />
            </g>
          );
        })}

        {/* Antenna index labels for hovered */}
        {hoveredId !== null && (() => {
          const a = selected.find(s => s.id === hoveredId);
          if (!a) return null;
          return (
            <text
              x={(a.x + 10).toFixed(2)}
              y={(a.y - 8).toFixed(2)}
              fill={C.selected}
              fontSize="8"
              fontWeight="600"
              fontFamily={tokens.font.mono}
            >
              #{a.id}
            </text>
          );
        })()}

        {/* Tooltip */}
        {tooltip.visible && Number.isFinite(tooltip.x) && (
          <g>
            <rect
              x={(tooltip.x + 10).toFixed(2)}
              y={(tooltip.y - 40).toFixed(2)}
              width="110"
              height="52"
              rx="4"
              fill={C.tooltipBg}
              stroke={C.tooltipBdr}
              strokeWidth="1"
              style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12)) drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
            />
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y - 24).toFixed(2)}
              fill={C.label} fontSize="10">
              Antena #{tooltip.id}
            </text>
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y - 10).toFixed(2)}
              fill={C.tooltipText} fontSize="11" fontWeight="500"
              style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtMoney(tooltip.cost)}
            </text>
            <text x={(tooltip.x + 16).toFixed(2)} y={(tooltip.y + 4).toFixed(2)}
              fill={C.selected} fontSize="9">
              SELECCIONADA ILP
            </text>
          </g>
        )}

        {/* Legend */}
        <g transform={`translate(8, ${height - 36})`}>
          <circle cx="6" cy="6" r="5" fill={C.selected} />
          <text x="14" y="10" fill={C.label} fontSize="9">22 seleccionadas (ILP)</text>
          <circle cx="6" cy="22" r="2.5" fill={C.unselected} opacity="0.5" />
          <text x="14" y="26" fill={C.label} fontSize="9">478 descartadas</text>
        </g>

        {/* Count badge */}
        <text x={(width - 8).toFixed(2)} y="16" textAnchor="end"
          fill={C.selected} fontSize="10" fontFamily={tokens.font.mono} fontWeight="600">
          {SELECTED_EXACT_ANTENNAS.length} / 500 ANTENAS
        </text>
      </svg>

      <style>{`
        @keyframes antPulse {
          0% { transform: scale(1); opacity: 0.25; }
          60% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
