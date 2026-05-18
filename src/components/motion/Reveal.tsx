'use client';

import React, { useEffect, useRef, type ElementType, type CSSProperties, type ReactNode } from 'react';

type RevealVariant = 'fadeUp' | 'fade' | 'scale' | 'blur';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reveal — visible-by-default CSS class-toggle pattern.
 *
 * Render flow:
 * 1. Element renders with class `reveal` → content fully visible (opacity 1, no transform).
 * 2. After mount, `is-armed` is added → CSS sets the "hidden" from-state.
 * 3. IntersectionObserver + getBoundingClientRect early check → adds `is-shown`.
 * 4. If JS fails / IO never fires → element stays in step-1, always readable. ✓
 */
export function Reveal({
  children,
  as: Tag = 'div',
  variant = 'fadeUp',
  delay = 0,
  className = '',
  style,
}: RevealProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const armedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Step 2 — arm the element (sets from-state)
    el.classList.add('is-armed');
    armedRef.current = true;

    const show = () => {
      if (!armedRef.current) return;
      el.classList.add('is-shown');
      armedRef.current = false;
    };

    // Early bounding rect check — already in viewport on mount
    const rect = el.getBoundingClientRect();
    const alreadyVisible =
      rect.top < window.innerHeight * 0.95 && rect.bottom > 0;

    if (alreadyVisible) {
      // Tiny delay so CSS from-state can apply first
      const t = setTimeout(show, 16 + delay * 1000);
      return () => {
        clearTimeout(t);
        el.classList.remove('is-armed', 'is-shown');
      };
    }

    // IO for below-fold elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            show();
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.05 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      el.classList.remove('is-armed', 'is-shown');
    };
  }, [delay]);

  // Use createElement to avoid JSX children type conflict with dynamic tags
  return React.createElement(
    Tag as string,
    {
      ref,
      className: `reveal ${className}`,
      'data-variant': variant,
      style: { transitionDelay: `${delay}s`, ...style },
    },
    children,
  );
}

export default Reveal;

