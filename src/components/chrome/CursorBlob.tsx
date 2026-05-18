'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * CursorBlob — soft cofounder-blue cursor follower for fine-pointer devices.
 *
 * - Default: 10px circle, mix-blend-mode difference, cofounder-blue
 * - On [data-cursor] elements: expands to 30px softly
 * - Skipped on pointer:coarse (touch devices)
 * - LERP factor 0.12 for elegant lag
 */
export function CursorBlob() {
  const blobRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const rafRef = useRef<number>(0);
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const animate = useCallback(() => {
    posRef.current.x = lerp(posRef.current.x, targetRef.current.x, 0.12);
    posRef.current.y = lerp(posRef.current.y, targetRef.current.y, 0.12);

    const blob = blobRef.current;
    if (blob) {
      blob.style.transform = `translate(${posRef.current.x.toFixed(2)}px, ${posRef.current.y.toFixed(2)}px) translate(-50%, -50%)`;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    // Skip on coarse pointer (touch)
    const mq = window.matchMedia('(pointer: coarse)');
    if (mq.matches) return;

    setVisible(true);
    rafRef.current = requestAnimationFrame(animate);

    const handleMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };

      // Check for [data-cursor] ancestor
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const isCursorTarget = !!el?.closest('[data-cursor]');
      setExpanded(isCursorTarget);
    };

    const handleLeave = () => setExpanded(false);

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
    <div
      ref={blobRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: expanded ? 30 : 10,
        height: expanded ? 30 : 10,
        borderRadius: '50%',
        background: 'var(--color-cofounder-blue)',
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'difference',
        willChange: 'transform, width, height',
        opacity: 0.85,
        transition: 'width 320ms var(--ease-default), height 320ms var(--ease-default), opacity 200ms',
        filter: expanded ? 'blur(4px)' : 'blur(0px)',
      }}
    />
  );
}
