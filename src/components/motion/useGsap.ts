'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { lerp as lerpUtil } from '@/lib/motion';

// Register plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);

  // Expose to LenisProvider for integration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__gsapScrollTrigger = ScrollTrigger;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__gsapTicker = gsap.ticker;
}

/* ═══════════════════════════════════════════════════
   useGsapPin — pin an element during scroll
   ═══════════════════════════════════════════════════ */
interface PinOptions {
  /** How many viewport heights to pin. Default 1 */
  scrubDuration?: number | boolean;
  start?: string;
  end?: string;
  anticipatePin?: number;
}

export function useGsapPin(
  ref: RefObject<HTMLElement | null>,
  options: PinOptions = {},
) {
  const { scrubDuration = true, start = 'top top', end, anticipatePin = 1 } = options;

  useGSAP(
    () => {
      if (!ref.current) return;
      const trigger = ScrollTrigger.create({
        trigger: ref.current,
        start,
        end: end ?? `+=${ref.current.offsetHeight}`,
        pin: true,
        scrub: scrubDuration,
        anticipatePin,
      });
      return () => trigger.kill();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { scope: ref as any, dependencies: [start, end, scrubDuration] },
  );
}

/* ═══════════════════════════════════════════════════
   useGsapDrawPath — draw SVG path on scroll
   ═══════════════════════════════════════════════════ */
interface DrawPathOptions {
  start?: string;
  end?: string;
  scrub?: boolean | number;
}

export function useGsapDrawPath(
  ref: RefObject<SVGPathElement | null>,
  length: number,
  options: DrawPathOptions = {},
) {
  const { start = 'top 80%', end = 'bottom 20%', scrub = true } = options;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap.set(el, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });

      const tween = gsap.to(el, {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start,
          end,
          scrub,
        },
      });

      return () => tween.kill();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { scope: ref as any, dependencies: [length, start, end] },
  );
}

/* ═══════════════════════════════════════════════════
   useMagnetic — magnetic hover with mouse lerp
   ═══════════════════════════════════════════════════ */
export function useMagnetic(
  ref: RefObject<HTMLElement | null>,
  strength = 0.3,
) {
  const rafRef = useRef<number>(0);
  const posRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let isHovered = false;

    const tick = () => {
      if (!isHovered && Math.abs(posRef.current.x) < 0.05 && Math.abs(posRef.current.y) < 0.05) {
        return;
      }
      posRef.current.x = lerpUtil(posRef.current.x, targetRef.current.x, 0.18);
      posRef.current.y = lerpUtil(posRef.current.y, targetRef.current.y, 0.18);
      if (el) {
        el.style.transform = `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const MAX_OFFSET = 8;
      targetRef.current = {
        x: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (e.clientX - cx) * strength)),
        y: Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (e.clientY - cy) * strength)),
      };
    };

    const handleEnter = () => {
      isHovered = true;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleLeave = () => {
      isHovered = false;
      targetRef.current = { x: 0, y: 0 };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    el.addEventListener('mousemove', handleMove, { passive: true });
    el.addEventListener('mouseenter', handleEnter);
    el.addEventListener('mouseleave', handleLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseenter', handleEnter);
      el.removeEventListener('mouseleave', handleLeave);
      el.style.transform = '';
    };
  }, [ref, strength]);
}
