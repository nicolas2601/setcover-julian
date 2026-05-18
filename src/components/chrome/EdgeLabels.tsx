'use client';

import { useEffect, useState } from 'react';

/**
 * EdgeLabels — vertical rotated labels at viewport extreme edges.
 * Only visible when hero is scrolled past (so they don't fight with hero content).
 * z-25 below TopNav (50) and Marquee (45), above content (10).
 */
export function EdgeLabels() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show only after we've scrolled past 80vh (hero is gone)
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hidden xl:block"
      style={{
        pointerEvents: 'none',
        zIndex: 25,
        opacity: visible ? 1 : 0,
        transition: 'opacity 360ms cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {/* Right edge — fixed to viewport right border */}
      <div
        style={{
          position: 'fixed',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 25,
          pointerEvents: 'none',
        }}
      >
        <span
          className="rot-label"
          style={{
            color: 'color-mix(in srgb, var(--color-warm-cream) 35%, transparent)',
            fontSize: '9px',
            letterSpacing: '0.22em',
          }}
        >
          SET&nbsp;COVER · IO&nbsp;UNAB · 2026
        </span>
      </div>

      {/* Left edge — mirrored */}
      <div
        style={{
          position: 'fixed',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 25,
          pointerEvents: 'none',
        }}
      >
        <span
          style={{
            writingMode: 'vertical-lr',
            fontSize: '9px',
            lineHeight: 1,
            color: 'color-mix(in srgb, var(--color-warm-cream) 35%, transparent)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-jakarta)',
          }}
        >
          NP-DIFÍCIL · 500×500
        </span>
      </div>
    </div>
  );
}
