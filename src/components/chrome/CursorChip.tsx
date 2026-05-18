'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface CursorState {
  x: number;
  y: number;
  label: string | null;
  expanded: boolean;
}

const LERP_FACTOR = 0.2;

/**
 * CursorChip — custom pill cursor.
 * Dot by default (6px warm-cream). Expands to ghost-pill with label
 * when hovering elements with data-cursor="label text".
 * Hidden on coarse pointer (touch). mix-blend-mode: difference.
 */
export function CursorChip() {
  const chipRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const [state, setState] = useState<CursorState>({ x: 0, y: 0, label: null, expanded: false });
  const [visible, setVisible] = useState(false);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animate = useCallback(() => {
    pos.current.x = lerp(pos.current.x, target.current.x, LERP_FACTOR);
    pos.current.y = lerp(pos.current.y, target.current.y, LERP_FACTOR);

    const chip = chipRef.current;
    const dot = dotRef.current;
    if (chip) chip.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
    if (dot) dot.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Only show on fine pointer
    const mq = window.matchMedia('(pointer: coarse)');
    if (mq.matches) return;

    setVisible(true);
    rafRef.current = requestAnimationFrame(animate);

    const handleMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };

      // Check for cursor label
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const cursorTarget = el?.closest('[data-cursor]') as HTMLElement | null;
      const label = cursorTarget?.dataset.cursor ?? null;
      setState((prev) => ({ ...prev, label, expanded: !!label }));
    };

    const handleLeave = () => setState((prev) => ({ ...prev, label: null, expanded: false }));

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [animate]);

  if (!visible) return null;

  return (
    <>
      {/* Small dot — always present */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--color-warm-cream)',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: 'difference',
          willChange: 'transform',
          opacity: state.expanded ? 0 : 1,
          transition: 'opacity 180ms cubic-bezier(0.32,0.72,0,1)',
        }}
      />

      {/* Expanded pill with label */}
      <div
        ref={chipRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          minWidth: 60,
          height: 28,
          borderRadius: 22.5,
          border: '1px solid var(--color-warm-cream)',
          background: 'transparent',
          color: 'var(--color-warm-cream)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
          pointerEvents: 'none',
          zIndex: 9998,
          mixBlendMode: 'difference',
          willChange: 'transform',
          opacity: state.expanded ? 1 : 0,
          transform: `translate(-50%, -50%) scale(${state.expanded ? 1 : 0.7})`,
          transition:
            'opacity 220ms cubic-bezier(0.32,0.72,0,1), transform 220ms cubic-bezier(0.32,0.72,0,1)',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-jakarta)',
        }}
      >
        {state.label}
      </div>
    </>
  );
}
