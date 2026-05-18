'use client';

import React, { useMemo } from 'react';
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

// GIC theme — this component may render on a light section (default) or dark
// We expose both sets and let the optimal node ring use cofounder-blue
const TC = {
  // Normal nodes (light bg context)
  nodeFill:         tokens.color.canvasWhite,    // #ffffff
  nodeStroke:       tokens.color.steelGray,      // #dee2de
  nodeText:         tokens.color.darkCharcoal,   // #171717
  // Pruned nodes
  prunedStroke:     tokens.color.lightGray,      // #b4b8b4
  prunedText:       tokens.color.lightGray,      // #b4b8b4
  prunedStrikethrough: tokens.color.lightGray,   // strikethrough medium-gray
  // Optimal node
  optimalStroke:    tokens.color.cofounderBlue,  // #0081c0
  optimalText:      tokens.color.cofounderBlue,  // #0081c0
  optimalRing:      tokens.color.cofounderBlue,  // pulsing ring
  // Edges
  edgeStroke:       tokens.color.steelGray,      // #dee2de
} as const;

// ─── SVG canvas ──────────────────────────────────────────────────────────────

const W = 780;
const H = 440;

const NODES: NodeDef[] = [
  { id: 'root', x: 390, y: 48,  label: 'LP relax',       sublabel: '$27,860', level: 0 },
  { id: 'l1a',  x: 180, y: 148, label: 'x₂ = 0',         sublabel: '$31,200', level: 1 },
  { id: 'l1b',  x: 600, y: 148, label: 'x₂ = 1',         sublabel: '$29,450', level: 1 },
  { id: 'l2a',  x: 90,  y: 248, label: 'x₅ = 0',         sublabel: '$38,100', level: 2 },
  { id: 'l2b',  x: 280, y: 248, label: 'x₅ = 1',         sublabel: '$35,750', pruned: true, level: 2 },
  { id: 'l2c',  x: 490, y: 248, label: 'x₁ = 0',         sublabel: '$41,300', level: 2 },
  { id: 'l2d',  x: 680, y: 248, label: 'x₁ = 1',         sublabel: '$44,800', level: 2 },
  { id: 'l3a',  x: 45,  y: 360, label: 'x₇ = 0',         sublabel: '$46,200', pruned: true, level: 3 },
  { id: 'l3b',  x: 145, y: 360, label: 'x₇ = 1',         sublabel: '$48,500', level: 3 },
  { id: 'l3c',  x: 580, y: 360, label: 'x₃ = 0',         sublabel: '$47,900', level: 3 },
  { id: 'l3d',  x: 695, y: 360, label: 'ÓPTIMO ENTERO',   sublabel: '$50,123 · 22 ANT.', optimal: true, level: 3 },
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
];

// ─── Lookup ───────────────────────────────────────────────────────────────────

function nodeById(id: string): NodeDef {
  return NODES.find(n => n.id === id)!;
}

// ─── Level visibility thresholds ─────────────────────────────────────────────

function levelVisible(level: number, progress: number): boolean {
  if (level === 0) return progress >= 0;
  if (level === 1) return progress >= 0.25;
  if (level === 2) return progress >= 0.5;
  if (level === 3) return progress >= 0.75;
  return false;
}

function edgeDrawLength(fromLevel: number, progress: number): number {
  const threshold = fromLevel === 0 ? 0 : fromLevel === 1 ? 0.25 : fromLevel === 2 ? 0.5 : 0.75;
  const range = 0.25;
  return Math.min(1, Math.max(0, (progress - threshold) / range));
}

// ─── Edge component ───────────────────────────────────────────────────────────

function Edge({ edge, progress }: { edge: EdgeDef; progress: number }) {
  const from = nodeById(edge.from);
  const to = nodeById(edge.to);

  const draw = edgeDrawLength(from.level, progress);
  if (draw <= 0) return null;

  const totalLen = Math.hypot(to.x - from.x, to.y - from.y);
  const drawn = draw * totalLen;
  const dashArray = `${drawn.toFixed(2)} ${(totalLen + 10).toFixed(2)}`;

  // Pruned branch edges get lighter stroke
  const isPrunedEdge = to.pruned;

  return (
    <line
      x1={from.x.toFixed(2)}
      y1={(from.y + 22).toFixed(2)}
      x2={to.x.toFixed(2)}
      y2={(to.y - 22).toFixed(2)}
      stroke={isPrunedEdge ? TC.prunedStroke : TC.edgeStroke}
      strokeWidth="1.5"
      strokeDasharray={dashArray}
      strokeDashoffset="0"
      opacity={isPrunedEdge ? 0.4 : 0.65}
    />
  );
}

// ─── Node component ───────────────────────────────────────────────────────────

function Node({
  node,
  progress,
}: {
  node: NodeDef;
  progress: number;
}) {
  const visible = levelVisible(node.level, progress);
  if (!visible) return null;

  const rx = 6;
  const ry = 6;
  const boxW = node.optimal ? 120 : 90;
  const boxH = node.optimal ? 40 : 34;
  const bx = (node.x - boxW / 2).toFixed(2);
  const by = (node.y - boxH / 2).toFixed(2);

  const showPruned = node.pruned && progress >= 0.75;
  const showOptimalRing = node.optimal && progress >= 0.9;
  const ringPulse = showOptimalRing
    ? 0.5 + 0.5 * Math.sin(Date.now() * 0.003)
    : 0;

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

  return (
    <g>
      {/* Pulsing ring for optimal node — cofounder-blue */}
      {showOptimalRing && (
        <rect
          x={(node.x - boxW / 2 - 6).toFixed(2)}
          y={(node.y - boxH / 2 - 6).toFixed(2)}
          width={boxW + 12}
          height={boxH + 12}
          rx={rx + 4}
          ry={ry + 4}
          fill="none"
          stroke={TC.optimalRing}
          strokeWidth="2"
          opacity={(0.3 + 0.5 * ringPulse).toFixed(3)}
        />
      )}

      {/* Box — canvas-white fill, colored stroke */}
      <rect
        x={bx}
        y={by}
        width={boxW}
        height={boxH}
        rx={rx}
        ry={ry}
        fill={TC.nodeFill}
        stroke={strokeColor}
        strokeWidth={node.optimal ? 1.5 : 1}
        opacity="0.97"
      />

      {/* Main label */}
      <text
        x={node.x.toFixed(2)}
        y={(node.y - 4).toFixed(2)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={node.optimal ? 7.5 : 8.5}
        fontFamily="var(--font-jetbrains), ui-monospace, monospace"
        fontWeight={node.optimal ? '500' : '400'}
        letterSpacing="0.08em"
      >
        {node.label}
      </text>

      {/* Sub-label */}
      {node.sublabel && (
        <text
          x={node.x.toFixed(2)}
          y={(node.y + 10).toFixed(2)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={node.optimal ? 7 : 7.5}
          fontFamily="var(--font-jetbrains), ui-monospace, monospace"
          opacity={node.pruned ? 0.5 : 0.65}
          letterSpacing="0.06em"
        >
          {node.sublabel}
        </text>
      )}

      {/* Strikethrough for pruned nodes — medium-gray */}
      {showPruned && (
        <line
          x1={(node.x - boxW / 2 + 6).toFixed(2)}
          y1={node.y.toFixed(2)}
          x2={(node.x + boxW / 2 - 6).toFixed(2)}
          y2={node.y.toFixed(2)}
          stroke={TC.prunedStrikethrough}
          strokeWidth="1.5"
          opacity="0.7"
        />
      )}
    </g>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BranchBoundTreeR3F({
  progress,
  className,
}: BranchBoundTreeR3FProps) {
  const clampedP = Math.min(1, Math.max(0, progress));

  const visibleEdges = useMemo(
    () => EDGES.filter(e => edgeDrawLength(nodeById(e.from).level, clampedP) > 0),
    [clampedP],
  );

  return (
    <div className={className} style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-label="Árbol Branch &amp; Bound"
        style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
      >
        {/* Edges first (behind nodes) */}
        {visibleEdges.map(e => (
          <Edge key={`${e.from}-${e.to}`} edge={e} progress={clampedP} />
        ))}

        {/* Nodes */}
        {NODES.map(n => (
          <Node key={n.id} node={n} progress={clampedP} />
        ))}
      </svg>
    </div>
  );
}
