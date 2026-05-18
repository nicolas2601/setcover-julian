'use client';

import { useScroll, useTransform, motion } from 'framer-motion';

/**
 * ScrollProgress — hairline 1px bar on the RIGHT edge.
 * Fill grows via scaleY driven by Framer useScroll yProgress.
 * Hidden under md breakpoint.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      aria-hidden="true"
      className="hidden md:block"
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        width: '1px',
        height: '100dvh',
        background: 'var(--color-cork-shadow)',
        zIndex: 40,
        transformOrigin: 'top center',
        pointerEvents: 'none',
      }}
    >
      <motion.div
        style={{
          width: '1px',
          height: '100%',
          background: 'var(--color-burnt-sienna)',
          transformOrigin: 'top',
          scaleY,
          willChange: 'transform',
        }}
      />
    </div>
  );
}
