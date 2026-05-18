'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * LenisProvider — mounts Lenis smooth scroll globally.
 * Skipped on prefers-reduced-motion.
 * Integrates with GSAP ScrollTrigger when available (peer dep).
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.6,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      lerp: 0.06,
      wheelMultiplier: 0.9,
    });

    lenisRef.current = lenis;

    // Add lenis classes to html
    document.documentElement.classList.add('lenis', 'lenis-smooth');

    // Integrate with GSAP ScrollTrigger if loaded
    type WinExt = Window & { __gsapScrollTrigger?: { update: () => void }; __gsapTicker?: { add: (fn: (t: number) => void) => void; remove: (fn: (t: number) => void) => void } };

    lenis.on('scroll', () => {
      // ScrollTrigger.update() — called dynamically to avoid hard dep at module level
      if (typeof window !== 'undefined' && (window as WinExt).__gsapScrollTrigger) {
        (window as WinExt).__gsapScrollTrigger!.update();
      }
    });

    // Connect to GSAP ticker if available
    const connectGsapTicker = () => {
      if (typeof window !== 'undefined' && (window as WinExt).__gsapTicker) {
        const ticker = (window as WinExt).__gsapTicker!;
        const tick = (t: number) => lenis.raf(t * 1000);
        ticker.add(tick);
        return () => ticker.remove(tick);
      }
      return null;
    };

    const removeGsapTicker = connectGsapTicker();

    // Fallback rAF loop (used when GSAP ticker not present)
    let cleanup: (() => void) | null = null;
    if (!removeGsapTicker) {
      let running = true;
      const raf = (time: number) => {
        if (!running) return;
        lenis.raf(time);
        rafRef.current = requestAnimationFrame(raf);
      };
      rafRef.current = requestAnimationFrame(raf);
      cleanup = () => {
        running = false;
        cancelAnimationFrame(rafRef.current);
      };
    }

    return () => {
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
      removeGsapTicker?.();
      cleanup?.();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
