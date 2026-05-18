'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { tokens } from '@/lib/tokens';

// ─── Types ───────────────────────────────────────────────────────────────────

interface BranchBoundTreeR3FProps {
  /** 0 → 1 driven by GSAP ScrollTrigger scrub */
  progress: number;
  className?: string;
}

interface NodeDef {
  id: string;
  x: number;
  y: number;
  label: string;
  sublabel?: string;
  pruned?: boolean;
  optimal?: boolean;
  level: number;
}

interface EdgeDef {
  from: string;
  to: string;
  label: string;
}

// GIC theme
const TC = {
  nodeFill:              tokens.color.canvasWhite,
  nodeStroke:            tokens.color.steelGray,
  nodeText:              tokens.color.darkCharcoal,
  prunedStroke:          tokens.color.lightGray,
  prunedText:            tokens.color.lightGray,
  prunedStrikethrough:   tokens.color.lightGray,
  optimalStroke:         tokens.color.cofounderBlue,
  optimalText:           tokens.color.cofounderBlue,
  optimalRing:           tokens.color.cofounderBlue,
  edgeStroke:            tokens.color.steelGray,
  shadowFill:            'rgba(0,0,0,0.06)',
  stepLabel:             tokens.color.mediumGray,
} as const;

// ─── Canvas layout (deeper, wider) ───────────────────────────────────────────

const W = 840;
const H = 520;

// Vertical spacing 80px, horizontal 60px per branch
const NODES: NodeDef[] = [
  { id: 'root', x: 420, y: 52,  label: 'LP relajación',     sublabel: '$27,860',            level: 0 },
  { id: 'l1a',  x: 200, y: 132, label: 'x₂ = 0',            sublabel: '$31,200',             level: 1 },
  { id: 'l1b',  x: 640, y: 132, label: 'x₂ = 1',            sublabel: '$29,450',             level: 1 },
  { id: 'l2a',  x: 100, y: 212, label: 'x₅ = 0',            sublabel: '$38,100',             level: 2 },
  { id: 'l2b',  x: 300, y: 212, label: 'x₅ = 1',            sublabel: '$35,750',  pruned: true, level: 2 },
  { id: 'l2c',  x: 540, y: 212, label: 'x₁ = 0',            sublabel: '$41,300',             level: 2 },
  { id: 'l2d',  x: 740, y: 212, label: 'x₁ = 1',            sublabel: '$44,800',             level: 2 },
  { id: 'l3a',  x: 48,  y: 292, label: 'x₇ = 0',            sublabel: '$46,200',  pruned: true, level: 3 },
  { id: 'l3b',  x: 164, y: 292, label: 'x₇ = 1',            sublabel: '$48,500',             level: 3 },
  { id: 'l3c',  x: 630, y: 292, label: 'x₃ = 0',            sublabel: '$47,900',             level: 3 },
  { id: 'l3d',  x: 780, y: 292, label: 'ÓPTIMO ENTERO',      sublabel: '$50,123 · 22 ANT.',   optimal: true, level: 3 },
  // Extra depth level — leaf confirmation nodes
  { id: 'l4a',  x: 120, y: 372, label: 'x₉ = 0',            sublabel: '$49,800',  pruned: true, level: 4 },
  { id: 'l4b',  x: 220, y: 372, label: 'x₉ = 1',            sublabel: '$51,200',  pruned: true, level: 4 },
  { id: 'l4c',  x: 580, y: 372, label: 'Entero factible',    sublabel: '$50,800',             level: 4 },
];

const EDGES: EdgeDef[] = [
  { from: 'root', to: 'l1a', label: '' },
  { from: 'root', to: 'l1b', label: '' },
  { from: 'l1a',  to: 'l2a', label: '' },
  { from: 'l1a',  to: 'l2b', label: '' },
  { from: 'l1b',  to: 'l2c', label: '' },
  { from: 'l1b',  to: 'l2d', label: '' },
  { from: 'l2a',  to: 'l3a', label: '' },
  { from: 'l2a',  to: 'l3b', label: '' },
  { from: 'l2d',  to: 'l3c', label: '' },
  { from: 'l2d',  to: 'l3d', label: '' },
  { from: 'l3b',  to: 'l4a', label: '' },
  { from: 'l3b',  to: 'l4b', label: '' },
  { from: 'l3c',  to: 'l4c', label: '' },
];

// ─── Step label sequence (shown in bottom-left) ───────────────────────────────

const STEP_LABELS: { progress: number; text: string }[] = [
  { progress: 0,    text: 'Resolviendo LP raíz...' },
  { progress: 0.15, text: 'Bifurcando sobre x₂...' },
  { progress: 0.30, text: 'Evaluando subproblemas...' },
  { progress: 0.45, text: 'Podando rama x₅ = 1 (cota ≥ UB)' },
  { progress: 0.60, text: 'Bifurcando sobre x₁...' },
  { progress: 0.72, text: 'Podando rama x₇ = 0 (cota ≥ UB)' },
  { progress: 0.82, text: 'Encontrado solución entera $50,123...' },
  { progress: 0.92, text: '¡Óptimo encontrado! · Gap = 0.00%' },
];

function currentStepLabel(p: number): string {
  let label = STEP_LABELS[0].text;
  for (const s of STEP_LABELS) {
    if (p >= s.progress) label = s.text;
  }
  return label;
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

function nodeById(id: string): NodeDef {
  return NODES.find(n => n.id === id)!;
}

// ─── Level visibility thresholds ─────────────────────────────────────────────

const LEVEL_THRESHOLDS = [0, 0.15, 0.40, 0.65, 0.82];

function levelVisible(level: number, progress: number): boolean {
  return progress >= (LEVEL_THRESHOLDS[level] ?? 0);
}

function edgeDrawFraction(fromLevel: number, progress: number): number {
  const threshold = LEVEL_THRESHOLDS[fromLevel] ?? 0;
  const range = 0.2;
  return Math.min(1, Math.max(0, (progress - threshold) / range));
}

// ─── Edge ────────────────────────────────────────────────────────────────────

function Edge({ edge, progress }: { edge: EdgeDef; progress: number }) {
  const from = nodeById(edge.from);
  const to = nodeById(edge.to);

  const draw = edgeDrawFraction(from.level, progress);
  if (draw <= 0) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const totalLen = Math.hypot(dx, dy);
  const drawn = draw * totalLen;
  const dashArray = `${drawn.toFixed(2)} ${(totalLen + 10).toFixed(2)}`;

  const isPrunedEdge = to.pruned;

  // For pruned edges: draw strikethrough X if progress is high enough
  const showX = isPrunedEdge && progress >= 0.80;

  // Midpoint for X
  const mx = (from.x + to.x) / 2;
  const my = (from.y + 22 + to.y - 22) / 2;

  return (
    <g>
      <line
        x1={from.x.toFixed(2)}
        y1={(from.y + 22).toFixed(2)}
        x2={to.x.toFixed(2)}
        y2={(to.y - 22).toFixed(2)}
        stroke={isPrunedEdge ? TC.prunedStroke : TC.edgeStroke}
        strokeWidth={isPrunedEdge ? '1' : '1.5'}
        strokeDasharray={dashArray}
        strokeDashoffset="0"
        opacity={isPrunedEdge ? 0.35 : 0.6}
      />
      {/* X strikethrough for pruned edges */}
      {showX && (
        <g opacity="0.7">
          <line
            x1={(mx - 5).toFixed(2)} y1={(my - 5).toFixed(2)}
            x2={(mx + 5).toFixed(2)} y2={(my + 5).toFixed(2)}
            stroke={TC.prunedStroke} strokeWidth="1.5" strokeLinecap="round"
          />
          <line
            x1={(mx + 5).toFixed(2)} y1={(my - 5).toFixed(2)}
            x2={(mx - 5).toFixed(2)} y2={(my + 5).toFixed(2)}
            stroke={TC.prunedStroke} strokeWidth="1.5" strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
}

// ─── Node ─────────────────────────────────────────────────────────────────────

function Node({ node, progress }: { node: NodeDef; progress: number }) {
  const visible = levelVisible(node.level, progress);
  if (!visible) return null;

  const boxW = node.optimal ? 128 : node.level >= 3 ? 96 : 88;
  const boxH = node.optimal ? 42 : 36;
  const bx = node.x - boxW / 2;
  const by = node.y - boxH / 2;
  const rx = 6;

  const showPruned = node.pruned && progress >= 0.78;
  const showOptimalRing = node.optimal && progress >= 0.88;

  const strokeColor = node.optimal
    ? TC.optimalStroke
    : node.pruned
    ? TC.prunedStroke
    : TC.nodeStroke;

  const textColor = node.optimal
    ? TC.optimalText
    : node.pruned
    ? TC.prunedText
    : TC.nodeText;

  const optRingOpacity = showOptimalRing
    ? 0.2 + 0.35 * Math.abs(Math.sin(Date.now() * 0.0025 + node.x))
    : 0;

  return (
    <g>
      {/* Drop shadow */}
      <rect
        x={(bx + 2).toFixed(2)}
        y={(by + 2).toFixed(2)}
        width={boxW.toFixed(2)}
        height={boxH.toFixed(2)}
        rx={rx + 1}
        fill={TC.shadowFill}
      />

      {/* Pulsing ring for optimal */}
      {showOptimalRing && (
        <>
          <rect
            x={(bx - 8).toFixed(2)}
            y={(by - 8).toFixed(2)}
            width={(boxW + 16).toFixed(2)}
            height={(boxH + 16).toFixed(2)}
            rx={rx + 6}
            fill="none"
            stroke={TC.optimalRing}
            strokeWidth="2"
            opacity={(optRingOpacity * 0.5).toFixed(3)}
          />
          <rect
            x={(bx - 4).toFixed(2)}
            y={(by - 4).toFixed(2)}
            width={(boxW + 8).toFixed(2)}
            height={(boxH + 8).toFixed(2)}
            rx={rx + 3}
            fill="none"
            stroke={TC.optimalRing}
            strokeWidth="1.5"
            opacity={(optRingOpacity).toFixed(3)}
          />
        </>
      )}

      {/* Box */}
      <rect
        x={bx.toFixed(2)}
        y={by.toFixed(2)}
        width={boxW.toFixed(2)}
        height={boxH.toFixed(2)}
        rx={rx}
        fill={node.optimal ? `${TC.optimalStroke}08` : TC.nodeFill}
        stroke={strokeColor}
        strokeWidth={node.optimal ? 1.5 : 1}
        opacity="0.97"
      />

      {/* Main label */}
      <text
        x={node.x.toFixed(2)}
        y={(node.y - 5).toFixed(2)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={node.optimal ? 7.5 : 8.5}
        fontFamily={tokens.font.mono}
        fontWeight={node.optimal ? '600' : '400'}
        letterSpacing="0.07em"
      >
        {node.label}
      </text>

      {/* Sublabel */}
      {node.sublabel && (
        <text
          x={node.x.toFixed(2)}
          y={(node.y + 9).toFixed(2)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={node.optimal ? 7 : 7.5}
          fontFamily={tokens.font.mono}
          opacity={node.pruned ? 0.45 : node.optimal ? 0.9 : 0.65}
          letterSpacing="0.05em"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {node.sublabel}
        </text>
      )}

      {/* Strikethrough for pruned */}
      {showPruned && (
        <line
          x1={(bx + 6).toFixed(2)}
          y1={node.y.toFixed(2)}
          x2={(bx + boxW - 6).toFixed(2)}
          y2={node.y.toFixed(2)}
          stroke={TC.prunedStrikethrough}
          strokeWidth="1.5"
          opacity="0.65"
        />
      )}

      {/* "ÓPTIMO" badge */}
      {node.optimal && progress >= 0.9 && (
        <text
          x={node.x.toFixed(2)}
          y={(by - 8).toFixed(2)}
          textAnchor="middle"
          fill={TC.optimalText}
          fontSize="7"
          fontFamily={tokens.font.mono}
          fontWeight="700"
          letterSpacing="0.1em"
          opacity="0.85"
        >
          ★ ÓPTIMO
        </text>
      )}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BranchBoundTreeR3F({ progress, className }: BranchBoundTreeR3FProps) {
  const clampedP = Math.min(1, Math.max(0, progress));

  const visibleEdges = useMemo(
    () => EDGES.filter(e => edgeDrawFraction(nodeById(e.from).level, clampedP) > 0),
    [clampedP],
  );

  const stepLabel = currentStepLabel(clampedP);

  return (
    <div className={className} style={{ width: '100%', overflowX: 'auto', fontFamily: tokens.font.family }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-label="Árbol Branch & Bound"
        style={{ maxWidth: '100%', display: 'block', margin: '0 auto', overflow: 'visible' }}
      >
        {/* Edges behind nodes */}
        {visibleEdges.map(e => (
          <Edge key={`${e.from}-${e.to}`} edge={e} progress={clampedP} />
        ))}

        {/* Nodes */}
        {NODES.map(n => (
          <Node key={n.id} node={n} progress={clampedP} />
        ))}

        {/* Current step label — bottom left */}
        <g transform={`translate(8, ${H - 20})`}>
          <rect x="-4" y="-14" width="340" height="20" rx="3"
            fill={tokens.color.canvasWhite} opacity="0.85" />
          <text
            x="0" y="0"
            fill={clampedP >= 0.88 ? TC.optimalText : TC.stepLabel}
            fontSize="9"
            fontFamily={tokens.font.mono}
            fontWeight={clampedP >= 0.88 ? '600' : '400'}
            letterSpacing="0.06em"
          >
            {stepLabel}
          </text>
        </g>

        {/* Level indicators on left edge */}
        {[0, 1, 2, 3, 4].map(lvl => {
          const y = 52 + lvl * 80;
          if (!levelVisible(lvl, clampedP)) return null;
          return (
            <text
              key={lvl}
              x="8"
              y={y.toFixed(2)}
              fill={TC.stepLabel}
              fontSize="8"
              fontFamily={tokens.font.mono}
              dominantBaseline="middle"
              opacity="0.5"
            >
              L{lvl}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
