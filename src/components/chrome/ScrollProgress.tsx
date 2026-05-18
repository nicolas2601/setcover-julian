'use client';

import { useScroll, useSpring, motion } from 'framer-motion';

/**
 * ScrollProgress — 2px horizontal bar at top of viewport.
 * Grows left-to-right as the page scrolls.
 * Fill color: --color-cofounder-blue.
 * Track is invisible (no background).
 * z-index 50 — above TopNav (z-50) via same stacking layer, rendered before.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  // Spring to smooth out the progress slightly
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 60,
        transformOrigin: 'left center',
        scaleX,
        background: 'var(--color-cofounder-blue)',
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  );
}
