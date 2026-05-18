'use client';

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from 'react';
import SplitTypeLib from 'split-type';

type SplitBy = 'chars' | 'words';

interface SplitTextProps {
  text: string;
  as?: ElementType;
  delay?: number;
  stagger?: number;
  className?: string;
  splitBy?: SplitBy;
  /** aria-label overrides the visible text for screen readers */
  ariaLabel?: string;
}

/**
 * SplitText — char/word reveal via split-type.
 *
 * Pattern:
 * - Renders text visible by default (SSR safe).
 * - On mount, split-type wraps chars/words in .split-char / .split-word spans.
 * - Adds `is-armed` only after split (not before) so flash never happens.
 * - Each char gets `is-in` class with stagger delay → CSS animates it in.
 */
export function SplitText({
  text,
  as: Tag = 'span',
  delay = 0,
  stagger = 0.022,
  className = '',
  splitBy = 'chars',
  ariaLabel,
}: SplitTextProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  const splitRef = useRef<SplitTypeLib | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    // Split text
    splitRef.current = new SplitTypeLib(el as HTMLElement, {
      types: splitBy === 'chars' ? 'lines,words,chars' : 'lines,words',
      tagName: 'span',
    });

    const items =
      splitBy === 'chars'
        ? splitRef.current.chars ?? []
        : splitRef.current.words ?? [];

    // Wrap lines in overflow-hidden containers
    const lines = splitRef.current.lines ?? [];
    lines.forEach((line) => {
      line.classList.add('split-line');
    });

    // Set initial armed state on items
    items.forEach((item, i) => {
      item.classList.add(splitBy === 'chars' ? 'split-char' : 'split-word');
      item.style.transitionDelay = `${delay + i * stagger}s`;
    });

    // Short RAF to ensure layout
    const t = requestAnimationFrame(() => {
      // Trigger via IO + early rect check
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;

      const show = () => {
        items.forEach((item) => item.classList.add('is-in'));
      };

      if (inView) {
        const delay2 = setTimeout(show, 32);
        return () => clearTimeout(delay2);
      }

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

      return () => observer.disconnect();
    });

    return () => {
      cancelAnimationFrame(t);
      splitRef.current?.revert();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, splitBy, delay, stagger]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createElement(
    Tag as any,
    {
      ref,
      className,
      'aria-label': ariaLabel ?? text,
      role: 'text',
      style: { display: 'block' },
    },
    text,
  );
}
