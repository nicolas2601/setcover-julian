'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useScroll, useTransform, motion, AnimatePresence } from 'framer-motion';
import { SplitText } from '@/components/motion/SplitText';

type NavEntry = { label: string; anchor: string };

const NAV_ITEMS: NavEntry[] = [
  { label: 'INTRO',       anchor: 'hero' },
  { label: 'PROBLEMA',    anchor: 'problema' },
  { label: 'MODELO',      anchor: 'formulacion' },
  { label: 'MÉTODOS',     anchor: 'exacto' },
  { label: 'RESULTADOS',  anchor: 'comparacion' },
];

/** Single magnetic nav pill — GIC blurred pill style */
function MagneticNavItem({
  entry,
  active,
  onClick,
}: {
  entry: NavEntry;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    targetRef.current = {
      x: Math.max(-6, Math.min(6, (e.clientX - cx) * 0.22)),
      y: Math.max(-4, Math.min(4, (e.clientY - cy) * 0.18)),
    };
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
      aria-current={active ? 'page' : undefined}
      style={{
        position: 'relative',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '6px 4px',
        color: active ? 'var(--color-cofounder-blue)' : 'var(--color-dark-charcoal)',
        fontFamily: 'var(--font-inter)',
        fontSize: '13px',
        fontWeight: 400,
        letterSpacing: '-0.012em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        transition: 'color 240ms var(--ease-default)',
        willChange: 'transform',
      }}
    >
      {entry.label}
      {/* Active underline */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 2,
          left: 4,
          right: 4,
          height: '1px',
          background: 'var(--color-cofounder-blue)',
          transformOrigin: 'left center',
          transform: active ? 'scaleX(1)' : 'scaleX(0)',
          transition: 'transform 360ms var(--ease-default)',
        }}
      />
    </button>
  );
}

export function TopNav() {
  const [activeAnchor, setActiveAnchor] = useState<string>('hero');
  const [wordmarkReady, setWordmarkReady] = useState(false);
  const { scrollY } = useScroll();

  // Background transitions: transparent → semi-opaque white
  const navBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.92)'],
  );
  const navBlur = useTransform(scrollY, [0, 100], [12, 12]);
  const borderOpacity = useTransform(scrollY, [80, 120], [0, 1]);

  // Active section via IntersectionObserver
  useEffect(() => {
    const anchorToEntry = new Map(NAV_ITEMS.map((n) => [n.anchor, n.anchor]));
    const sections = NAV_ITEMS.map((n) => document.getElementById(n.anchor));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
            const anchor = anchorToEntry.get(entry.target.id);
            if (anchor) setActiveAnchor(anchor);
          }
        });
      },
      { threshold: 0.25 },
    );

    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Wordmark letter reveal on mount
  useEffect(() => {
    const t = setTimeout(() => setWordmarkReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const scrollToSection = (entry: NavEntry) => {
    const el = document.getElementById(entry.anchor);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setActiveAnchor(entry.anchor);
  };

  return (
    <motion.header
      style={{ backgroundColor: navBg, backdropFilter: `blur(12px)`, WebkitBackdropFilter: `blur(12px)` }}
      className="fixed top-0 left-0 right-0 z-50"
      role="banner"
    >
      {/* Bottom hairline — appears after scroll */}
      <motion.div
        aria-hidden="true"
        style={{
          opacity: borderOpacity,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '1px',
          background: 'var(--color-steel-gray)',
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
          padding: '0 var(--gutter)',
          minHeight: 56,
        }}
      >
        {/* LEFT — serif wordmark + caption */}
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
            flexShrink: 0,
          }}
          aria-label="SET COVER — Ir al inicio"
        >
          <AnimatePresence>
            {wordmarkReady ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                  fontFamily: 'var(--font-crimson), ui-serif, Georgia, serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-dark-charcoal)',
                  fontFeatureSettings: '"liga" 0',
                }}
              >
                <SplitText
                  text="SET COVER"
                  as="span"
                  delay={0}
                  stagger={0.03}
                  splitBy="chars"
                  ariaLabel="SET COVER"
                  className="font-serif"
                />
              </motion.span>
            ) : (
              <span
                style={{
                  fontFamily: 'var(--font-crimson), ui-serif, Georgia, serif',
                  fontSize: '18px',
                  fontWeight: 500,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-dark-charcoal)',
                }}
              >
                SET COVER
              </span>
            )}
          </AnimatePresence>
          <sup
            style={{
              fontSize: '10px',
              letterSpacing: '0.08em',
              color: 'var(--color-medium-gray)',
              verticalAlign: 'super',
              lineHeight: 1,
              fontWeight: 400,
              fontFamily: 'var(--font-inter)',
            }}
          >
            [01&nbsp;/&nbsp;10]
          </sup>
        </a>

        {/* CENTER — nav pills, hidden below md */}
        <div
          className="hidden md:flex"
          role="list"
          style={{ alignItems: 'center', gap: 20 }}
        >
          {NAV_ITEMS.map((entry) => (
            <div key={entry.anchor} role="listitem">
              <MagneticNavItem
                entry={entry}
                active={activeAnchor === entry.anchor}
                onClick={() => scrollToSection(entry)}
              />
            </div>
          ))}
        </div>

        {/* RIGHT — outlined azure button */}
        <a
          href="/matlab/run_all.m"
          download
          className="btn-outlined-azure"
          style={{ whiteSpace: 'nowrap', flexShrink: 0, fontSize: '13px' }}
        >
          DESCARGAR MATLAB
        </a>
      </nav>
    </motion.header>
  );
}
