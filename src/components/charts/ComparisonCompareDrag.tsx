'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { tokens } from '@/lib/tokens';

const PANEL_HEIGHT = 400;
const HANDLE_W = 2;

// GIC palette
const C = {
  // Left panel: exact — dark charcoal bg
  leftBg:       tokens.color.darkCharcoal,    // #171717
  // Right panel: heuristic — off-white / canvas-white
  rightBg:      tokens.color.offWhite,        // #fefffc
  // Accents
  leftAccent:   tokens.color.canvasWhite,     // text on dark panel
  rightAccent:  tokens.color.cofounderBlue,   // #0081c0 — GA highlight
  metaText:     tokens.color.mediumGray,      // #646464
  handle:       tokens.color.cofounderBlue,   // divider line color
  // Drag pill
  pillBg:       tokens.color.cofounderBlue,
  pillText:     tokens.color.canvasWhite,
  pillBdr:      tokens.color.actionAzure,
  // Dashed accent
  dividerLeft:  tokens.color.slateGray,
  dividerRight: tokens.color.steelGray,
} as const;

interface PanelData {
  label: string;
  method: string;
  cost: string;
  meta: string;
  side: 'left' | 'right';
}

const LEFT: PanelData = {
  label: 'EXACTO',
  method: 'BRANCH & BOUND',
  cost: '$50,123',
  meta: '22 antenas · 5 min',
  side: 'left',
};
const RIGHT: PanelData = {
  label: 'HEURÍSTICO',
  method: 'ALGORITMO GENÉTICO',
  cost: '$50,546',
  meta: '23 antenas · 44 s',
  side: 'right',
};

export default function ComparisonCompareDrag() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const x = useMotionValue(0); // offset from center

  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && Number.isFinite(w)) setContainerWidth(w);
    });
    ro.observe(node);
    setContainerWidth(node.getBoundingClientRect().width || 800);
  }, []);

  const leftClip = useTransform(x, (v) => {
    const raw = containerWidth / 2 + v;
    return Math.max(40, Math.min(containerWidth - 40, raw));
  });

  const handleX = useTransform(leftClip, (v) => v - HANDLE_W / 2);

  return (
    <div
      ref={(el) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        measuredRef(el);
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: PANEL_HEIGHT,
        overflow: 'hidden',
        fontFamily: tokens.font.family,
        userSelect: 'none',
      }}
      aria-label="Comparación interactiva de métodos de optimización"
    >
      {/* LEFT panel — dark (Exact) */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: containerWidth,
          height: PANEL_HEIGHT,
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: containerWidth,
            height: PANEL_HEIGHT,
            clipPath: useTransform(
              leftClip,
              (v) => `inset(0 ${Math.max(0, containerWidth - v)}px 0 0)`,
            ),
          }}
        >
          <PanelContent data={LEFT} width={containerWidth} />
        </motion.div>
      </motion.div>

      {/* RIGHT panel — light (GA) */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: containerWidth,
          height: PANEL_HEIGHT,
          clipPath: useTransform(
            leftClip,
            (v) => `inset(0 0 0 ${Math.max(0, v)}px)`,
          ),
        }}
      >
        <PanelContent data={RIGHT} width={containerWidth} />
      </motion.div>

      {/* Vertical handle line */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: HANDLE_W,
          height: PANEL_HEIGHT,
          background: C.handle,
          x: handleX,
          opacity: 0.9,
          pointerEvents: 'none',
        }}
      />

      {/* Drag pill */}
      <motion.div
        drag="x"
        dragConstraints={{
          left: -(containerWidth / 2 - 60),
          right: containerWidth / 2 - 60,
        }}
        dragElastic={0}
        dragMomentum={false}
        style={{
          position: 'absolute',
          top: '50%',
          x: handleX,
          y: '-50%',
          translateY: '-50%',
          cursor: 'ew-resize',
          zIndex: 10,
          touchAction: 'none',
        }}
        onDrag={(_, info) => {
          x.set(x.get() + info.delta.x);
        }}
      >
        <div
          style={{
            background: C.pillBg,
            color: C.pillText,
            borderRadius: '36px',
            padding: '8px 14px',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
            border: `1px solid ${C.pillBdr}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
        >
          DRAG
        </div>
      </motion.div>
    </div>
  );
}

function PanelContent({
  data,
  width,
}: {
  data: PanelData;
  width: number;
}) {
  const isLeft = data.side === 'left';
  // Left = dark panel (exact), Right = light panel (GA)
  const bg = isLeft ? C.leftBg : C.rightBg;
  const accentColor = isLeft ? C.leftAccent : C.rightAccent;
  const methodColor = isLeft ? tokens.color.lightGray : tokens.color.mediumGray;
  const dividerColor = isLeft ? C.dividerLeft : C.dividerRight;

  return (
    <div
      style={{
        width,
        height: PANEL_HEIGHT,
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: isLeft ? 'flex-start' : 'flex-end',
        padding: '48px 56px',
        boxSizing: 'border-box',
      }}
    >
      {/* Method badge */}
      <span
        style={{
          fontSize: '11px',
          color: methodColor,
          letterSpacing: '0.12em',
          marginBottom: '12px',
          textTransform: 'uppercase',
        }}
      >
        {data.method}
      </span>

      {/* Big display cost */}
      <div
        style={{
          fontSize: '56px',
          fontWeight: 500,
          color: accentColor,
          lineHeight: 0.9,
          marginBottom: '16px',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        {data.cost}
      </div>

      {/* Meta */}
      <span
        style={{
          fontSize: '14px',
          color: isLeft ? tokens.color.lightGray : C.metaText,
          opacity: 0.75,
          marginBottom: '24px',
        }}
      >
        {data.meta}
      </span>

      {/* Label pill */}
      <div
        style={{
          padding: '6px 16px',
          border: `1px solid ${accentColor}`,
          borderRadius: '22px',
          fontSize: '11px',
          color: accentColor,
          letterSpacing: '0.1em',
        }}
      >
        {data.label}
      </div>

      {/* Dashed divider accent */}
      <div
        style={{
          marginTop: '28px',
          width: '60px',
          height: '1px',
          borderTop: `1px dashed ${dividerColor}`,
        }}
      />
    </div>
  );
}
