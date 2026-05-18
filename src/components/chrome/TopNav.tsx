'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

type NavEntry = { label: string; anchor: string };
const NAV_ITEMS: NavEntry[] = [
  { label: 'INTRO',       anchor: 'hero' },
  { label: 'PROBLEMA',    anchor: 'problema' },
  { label: 'MODELO',      anchor: 'formulacion' },
  { label: 'MÉTODOS',     anchor: 'exacto' },
  { label: 'RESULTADOS',  anchor: 'comparacion' },
];
type NavItem = string;

/** Single-line magnetic nav item — clean, no overlapping reveals */
function MagneticItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetRef.current = {
      x: Math.max(-6, Math.min(6, (e.clientX - cx) * 0.25)),
      y: Math.max(-4, Math.min(4, (e.clientY - cy) * 0.2)),
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      posRef.current.x = lerp(posRef.current.x, targetRef.current.x, 0.18);
      posRef.current.y = lerp(posRef.current.y, targetRef.current.y, 0.18);
      if (ref.current) {
        ref.current.style.transform = `translate(${posRef.current.x.toFixed(2)}px, ${posRef.current.y.toFixed(2)}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleMouseLeave = useCallback(() => {
    targetRef.current = { x: 0, y: 0 };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      posRef.current.x = lerp(posRef.current.x, 0, 0.18);
      posRef.current.y = lerp(posRef.current.y, 0, 0.18);
      const dist = Math.abs(posRef.current.x) + Math.abs(posRef.current.y);
      if (ref.current) {
        ref.current.style.transform = `translate(${posRef.current.x.toFixed(2)}px, ${posRef.current.y.toFixed(2)}px)`;
      }
      if (dist > 0.05) {
        rafRef.current = requestAnimationFrame(tick);
      } else if (ref.current) {
        ref.current.style.transform = '';
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
      aria-current={active ? 'true' : undefined}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 4px',
        color: active ? 'var(--color-burnt-sienna)' : 'var(--color-warm-cream)',
        opacity: active ? 1 : 0.7,
        fontFamily: 'var(--font-jakarta)',
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        transition: 'color 240ms cubic-bezier(0.32,0.72,0,1), opacity 240ms',
        willChange: 'transform',
      }}
    >
      {label}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -1,
          left: 4,
          right: 4,
          height: '1px',
          background: 'var(--color-burnt-sienna)',
          transformOrigin: 'left center',
          transform: active ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 380ms cubic-bezier(0.32,0.72,0,1)',
        }}
      />
    </button>
  );
}

export function TopNav() {
  const [activeItem, setActiveItem] = useState<NavItem>('INTRO');
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 500], ['rgba(16,9,4,0)', 'rgba(16,9,4,0.88)']);
  const navBlurRaw = useTransform(scrollY, [0, 500], [0, 1]);
  const navBlur = useTransform(navBlurRaw, (v) => `blur(${(v * 14).toFixed(1)}px)`);
  const borderOpacity = useTransform(scrollY, [0, 500], [0, 0.5]);

  useEffect(() => {
    const anchorToLabel = new Map(NAV_ITEMS.map((n) => [n.anchor, n.label] as const));
    const sections = NAV_ITEMS.map((n) => document.getElementById(n.anchor));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            const label = anchorToLabel.get(entry.target.id);
            if (label) setActiveItem(label);
          }
        });
      },
      { threshold: 0.3 },
    );
    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (entry: NavEntry) => {
    const el = document.getElementById(entry.anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setActiveItem(entry.label);
  };

  return (
    <motion.header
      style={{ backgroundColor: navBg, backdropFilter: navBlur }}
      className="fixed top-0 left-0 right-0 z-50"
      role="banner"
    >
      <motion.div
        style={{
          opacity: borderOpacity,
          borderBottom: '1px solid var(--color-cork-shadow)',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      />
      <nav
        aria-label="Navegación principal"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '16px var(--gutter)',
          minHeight: 56,
        }}
      >
        {/* Wordmark — clean single render */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection(NAV_ITEMS[0]);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 8,
            textDecoration: 'none',
            color: 'var(--color-warm-cream)',
            fontFamily: 'var(--font-jakarta)',
            fontSize: '16px',
            fontWeight: 500,
            letterSpacing: '-0.005em',
            flexShrink: 0,
          }}
        >
          SET&nbsp;COVER
          <sup
            style={{
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: 'var(--color-grey-brown)',
              verticalAlign: 'super',
              lineHeight: 1,
              fontWeight: 400,
            }}
          >
            [01 / 10]
          </sup>
        </a>

        {/* Center — hidden under md */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 28 }} role="list">
          {NAV_ITEMS.map((entry) => (
            <div key={entry.label} role="listitem">
              <MagneticItem
                label={entry.label}
                active={activeItem === entry.label}
                onClick={() => scrollToSection(entry)}
              />
            </div>
          ))}
        </div>

        {/* Right CTA */}
        <a
          href="/matlab/run_all.m"
          download
          className="btn-ghost"
          style={{
            fontSize: '11px',
            letterSpacing: '0.14em',
            padding: '8px 16px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          DESCARGAR MATLAB
        </a>
      </nav>
    </motion.header>
  );
}
