'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { easeOutExpo } from '@/lib/motion';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * CountUp — animates a number from `from` to `to`.
 *
 * Anti-pattern fix: initial display value = `to` (NOT 0).
 * If animation never fires, the correct final value is visible. ✓
 *
 * Triggers via IntersectionObserver + early getBoundingClientRect check.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.6,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  style,
}: CountUpProps) {
  // Start showing the final `to` value — visible-by-default
  const [display, setDisplay] = useState<string>(
    formatNumber(to, decimals),
  );
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number>(0);
  const startedRef = useRef(false);

  function formatNumber(n: number, d: number): string {
    return n.toLocaleString('es-CO', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const runAnimation = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      const startTime = performance.now();
      const durationMs = duration * 1000;

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const eased = easeOutExpo(progress);
        const current = from + (to - from) * eased;
        setDisplay(formatNumber(current, decimals));
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setDisplay(formatNumber(to, decimals));
        }
      };

      // Reset to `from` right before starting
      setDisplay(formatNumber(from, decimals));
      // Small delay so the reset renders first
      const t = setTimeout(() => {
        rafRef.current = requestAnimationFrame(tick);
      }, 32);
      return t;
    };

    // Early bounding rect check
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;

    let timeout: ReturnType<typeof setTimeout>;
    if (inView) {
      timeout = runAnimation()!;
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              timeout = runAnimation()!;
              observer.unobserve(el);
            }
          });
        },
        { threshold: 0.1 },
      );
      observer.observe(el);

      return () => {
        cancelAnimationFrame(rafRef.current);
        clearTimeout(timeout);
        observer.disconnect();
      };
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, from, duration, decimals]);

  return (
    <span
      ref={ref}
      className={`tnum ${className}`}
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
        display: 'inline',
        ...style,
      }}
      aria-label={`${prefix}${to}${suffix}`}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
