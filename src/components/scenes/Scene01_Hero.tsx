'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useCallback } from 'react';
import SceneAnchor from '@/components/chrome/SceneAnchor';

const HeroWebGL = dynamic(() => import('@/components/visual/HeroWebGL'), {
  ssr: false,
  loading: () => <ConstellationFallback />,
});

// ─── Fallback constellation (no-JS / no-WebGL) ───────────────────────────────
function ConstellationFallback() {
  const dots: { x: number; y: number; r: number; sel: boolean }[] = [];
  const phi = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < 80; i++) {
    const angle = (2 * Math.PI * i) / phi;
    const radius = Math.sqrt(i / 80) * 44;
    dots.push({
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle) * 0.7,
      r: i % 11 === 0 ? 0.7 : 0.28,
      sel: i % 11 === 0,
    });
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x.toFixed(2)}
          cy={d.y.toFixed(2)}
          r={d.r}
          fill={d.sel ? '#dc5000' : '#ffedd7'}
          opacity={d.sel ? 0.85 : 0.35}
        />
      ))}
    </svg>
  );
}

// ─── Magnetic button wrapper ──────────────────────────────────────────────────
function MagneticBtn({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.18;
    el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0px, 0px)';
    el.style.transition = 'transform 460ms cubic-bezier(0.32,0.72,0,1)';
  }, []);

  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'transform' }}
    >
      {children}
    </button>
  );
}

// ─── Hero scene ───────────────────────────────────────────────────────────────
export function Scene01_Hero() {
  const headlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const chars = el.querySelectorAll<HTMLSpanElement>('.hero-char');
    chars.forEach((c, i) => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(60%)';
      c.style.transition = `opacity 800ms cubic-bezier(0.32,0.72,0,1) ${120 + i * 30}ms, transform 800ms cubic-bezier(0.32,0.72,0,1) ${120 + i * 30}ms`;
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chars.forEach((c) => {
          c.style.opacity = '1';
          c.style.transform = 'none';
        });
      });
    });
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <SceneAnchor
      id="hero"
      n={1}
      ariaLabel="Hero — Set Cover, dos elevado a quinientos"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: 'var(--color-studio-black)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* WebGL background — full bleed */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <noscript><ConstellationFallback /></noscript>
        <div style={{ width: '100%', height: '100%' }}>
          <HeroWebGL className="w-full h-full" />
        </div>
      </div>

      {/* Vignette overlay — gives WebGL depth */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 0%, transparent 50%, rgba(16,9,4,0.8) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top metadata strip — sits BELOW the TopNav */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '88px var(--gutter) 24px',
          gap: 24,
        }}
      >
        <span
          className="t-meta"
          style={{ color: 'var(--color-grey-brown)', whiteSpace: 'nowrap' }}
        >
          INVESTIGACIÓN&nbsp;DE&nbsp;OPERACIONES
        </span>
        <span
          className="t-meta"
          style={{
            color: 'var(--color-grey-brown)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 40, height: 1, background: 'var(--color-cork-shadow)' }}
          />
          UNAB · 2026
        </span>
      </div>

      {/* Main content — asymmetric grid */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 'clamp(32px, 5vw, 80px)',
          padding: 'clamp(24px, 4vh, 56px) var(--gutter) clamp(56px, 8vh, 120px)',
          alignItems: 'end',
        }}
      >
        {/* LEFT — display headline (controlled to avoid mid-word breaks) */}
        <div ref={headlineRef} style={{ minWidth: 0 }}>
          {/* 2^500 — single composed glyph */}
          <div
            style={{
              fontSize: 'clamp(96px, 18vw, 264px)',
              fontWeight: 500,
              lineHeight: 0.86,
              letterSpacing: '-0.04em',
              color: 'var(--color-warm-cream)',
              fontFamily: 'var(--font-jakarta)',
              marginBottom: 'clamp(20px, 3vh, 40px)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.04em',
            }}
          >
            <span className="hero-char" style={{ display: 'inline-block' }}>2</span>
            <span
              className="hero-char"
              style={{
                display: 'inline-block',
                fontSize: '0.42em',
                lineHeight: 1,
                color: 'var(--color-burnt-sienna)',
                marginTop: '0.04em',
              }}
            >
              500
            </span>
          </div>

          {/* Headline supporting lines — controlled max-width prevents bad wraps */}
          <h1
            style={{
              fontSize: 'clamp(32px, 5.4vw, 64px)',
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: '-0.022em',
              color: 'var(--color-warm-cream)',
              fontFamily: 'var(--font-jakarta)',
              margin: 0,
              maxWidth: '14ch',
            }}
          >
            <span style={{ display: 'block', overflow: 'hidden' }}>
              {'Combinaciones.'.split('').map((ch, i) => (
                <span
                  key={`a-${i}`}
                  className="hero-char"
                  style={{
                    display: 'inline-block',
                    whiteSpace: ch === ' ' ? 'pre' : 'normal',
                  }}
                >
                  {ch}
                </span>
              ))}
            </span>
            <span
              style={{
                display: 'block',
                overflow: 'hidden',
                color: 'color-mix(in srgb, var(--color-warm-cream) 50%, transparent)',
                fontStyle: 'italic',
                fontWeight: 400,
              }}
            >
              {'Solo una es óptima.'.split('').map((ch, i) => (
                <span
                  key={`b-${i}`}
                  className="hero-char"
                  style={{
                    display: 'inline-block',
                    whiteSpace: ch === ' ' ? 'pre' : 'normal',
                  }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </h1>
        </div>

        {/* RIGHT — editorial body, fixed width container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(20px, 3vh, 36px)',
            paddingLeft: 'clamp(24px, 3vw, 56px)',
            borderLeft: '1px dashed var(--color-cork-shadow)',
            maxWidth: '40ch',
            justifySelf: 'end',
          }}
        >
          <div className="div-accent" />
          <p
            style={{
              fontSize: 'clamp(17px, 1.3vw, 20px)',
              lineHeight: 1.45,
              color: 'var(--color-warm-cream)',
              opacity: 0.92,
              margin: 0,
              fontFamily: 'var(--font-jakarta)',
              fontWeight: 400,
              letterSpacing: '-0.005em',
            }}
          >
            500&nbsp;antenas. 500&nbsp;clientes. ¿Cuál es el subconjunto más
            barato que cubre a todos —{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--color-burnt-sienna)' }}>
              sin enumerar 2⁵⁰⁰&nbsp;opciones?
            </em>
          </p>

          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.55,
              color: 'var(--color-grey-brown)',
              margin: 0,
              fontFamily: 'var(--font-jakarta)',
              letterSpacing: '-0.002em',
            }}
          >
            Programación lineal entera contra algoritmo genético.
            Cuatro métodos, una respuesta.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
            <MagneticBtn className="btn-pill" onClick={() => scrollTo('problema')}>
              <span>Ver el problema</span>
              <span aria-hidden="true" style={{ marginLeft: 4 }}>→</span>
            </MagneticBtn>
            <MagneticBtn className="btn-ghost" onClick={() => scrollTo('exacto')}>
              Saltar a métodos
            </MagneticBtn>
          </div>
        </div>
      </div>

      {/* Scroll prompt — bottom center, away from CTAs */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 70,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        <span
          className="t-meta"
          style={{
            color: 'color-mix(in srgb, var(--color-warm-cream) 40%, transparent)',
            fontSize: '10px',
          }}
        >
          SCROLL
        </span>
        <div
          style={{
            width: 1,
            height: 40,
            background: 'var(--color-cork-shadow)',
            animation: 'heroScrollPulse 1.8s cubic-bezier(0.32,0.72,0,1) infinite',
          }}
        />
        <style>{`
          @keyframes heroScrollPulse {
            0%   { transform: scaleY(0); transform-origin: top; opacity: 1; }
            50%  { transform: scaleY(1); transform-origin: top; opacity: 1; }
            51%  { transform: scaleY(1); transform-origin: bottom; }
            100% { transform: scaleY(0); transform-origin: bottom; opacity: 0.2; }
          }
        `}</style>
      </div>
    </SceneAnchor>
  );
}
