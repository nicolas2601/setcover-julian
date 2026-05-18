'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useCallback, useState } from 'react';
import SceneAnchor from '@/components/chrome/SceneAnchor';

// Lazy-load WebGL — kept inert until first idle window after mount so the
// initial paint is the fast SVG fallback. Saves ~1MB of three.js + drei from
// blocking LCP.
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
          fill={d.sel ? '#0081c0' : '#ffffff'}
          opacity={d.sel ? 0.85 : 0.25}
        />
      ))}
    </svg>
  );
}

// ─── Hero Stat tile (translucent overlay card over dark bg) ──────────────────
function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-hero-overlay" style={{ textAlign: 'center', minWidth: 120 }}>
      <div
        className="font-mono tnum"
        style={{
          fontSize: 'clamp(22px, 2.8vw, 36px)',
          fontWeight: 500,
          color: 'var(--color-canvas-white)',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div
        className="t-caption tracking-meta"
        style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Hero scene — DARK ────────────────────────────────────────────────────────
export function Scene01_Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  // Defer WebGL until after first paint + browser idle. Initial render shows
  // the SVG fallback (instant, ~3KB) so the hero is painted ASAP.
  const [webglReady, setWebglReady] = useState(false);

  useEffect(() => {
    // Animation
    const el = headlineRef.current;
    if (el) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        const words = el.querySelectorAll<HTMLSpanElement>('.hero-word');
        words.forEach((w, i) => {
          w.style.opacity = '0';
          w.style.transform = 'translateY(40%)';
          w.style.transition = `opacity 900ms cubic-bezier(0.32,0.72,0,1) ${100 + i * 80}ms, transform 900ms cubic-bezier(0.32,0.72,0,1) ${100 + i * 80}ms`;
        });
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            words.forEach((w) => {
              w.style.opacity = '1';
              w.style.transform = 'none';
            });
          });
        });
      }
    }

    // Defer WebGL mount to next idle window (or 800ms fallback)
    type IdleHandle = number;
    type IdleCallback = (cb: () => void, opts?: { timeout: number }) => IdleHandle;
    const idle = (window as unknown as { requestIdleCallback?: IdleCallback }).requestIdleCallback;
    if (idle) {
      const id = idle(() => setWebglReady(true), { timeout: 1200 });
      return () => {
        const cancel = (window as unknown as { cancelIdleCallback?: (h: IdleHandle) => void }).cancelIdleCallback;
        if (cancel) cancel(id);
      };
    }
    const t = setTimeout(() => setWebglReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <SceneAnchor
      id="hero"
      n={1}
      ariaLabel="Hero — Set Cover, dos elevado a quinientos"
      className="dark-section"
      style={{
        position: 'relative',
        minHeight: '100dvh',
        background: 'var(--color-night-sky)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* WebGL background — instant SVG first, WebGL deferred to idle */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <ConstellationFallback />
        {webglReady && (
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              inset: 0,
              animation: 'webglFadeIn 600ms cubic-bezier(0.32,0.72,0,1) forwards',
              opacity: 0,
            }}
          >
            <HeroWebGL className="w-full h-full" />
            <style>{`@keyframes webglFadeIn { to { opacity: 1; } }`}</style>
          </div>
        )}
      </div>

      {/* Radial gradient overlay — center transparent → night-sky at edges */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 0%, transparent 40%, rgba(31,31,41,0.75) 80%, rgba(31,31,41,0.95) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Meta strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          padding: '88px var(--gutter) 0',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <span
          className="t-caption tracking-meta"
          style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.18em' }}
        >
          INVESTIGACIÓN DE OPERACIONES · UNAB · 2026
        </span>
      </div>

      {/* Main centered content */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'clamp(40px, 6vh, 80px) var(--gutter)',
          gap: 'clamp(24px, 3.5vh, 48px)',
        }}
      >
        {/* Display headline — serif */}
        <h1
          ref={headlineRef}
          className="font-serif"
          style={{
            fontSize: 'clamp(64px, 9vw, 128px)',
            fontWeight: 400,
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            color: 'var(--color-canvas-white)',
            maxWidth: '14ch',
            margin: 0,
          }}
        >
          <span className="hero-word" style={{ display: 'inline-block' }}>Cada</span>{' '}
          <span className="hero-word" style={{ display: 'inline-block' }}>elección</span>
          <br />
          <span
            className="hero-word"
            style={{
              display: 'inline-block',
              fontStyle: 'italic',
              color: 'var(--color-action-azure)',
            }}
          >
            importa.
          </span>
        </h1>

        {/* Subtext — sans */}
        <p
          className="font-sans t-subheading"
          style={{
            color: 'rgba(255,255,255,0.82)',
            maxWidth: '56ch',
            margin: 0,
            fontWeight: 400,
            lineHeight: 1.45,
          }}
        >
          500 antenas, 500 clientes, 2<sup style={{ fontSize: '0.6em', verticalAlign: 'super' }}>500</sup> combinaciones — pero solo una es óptima.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn-solid-dark"
            onClick={() => scrollTo('problema')}
            aria-label="Ver el estudio"
          >
            VER EL ESTUDIO
          </button>
          <button
            className="btn-outlined-azure"
            onClick={() => scrollTo('exacto')}
            aria-label="Ver implementación"
            style={{
              borderColor: 'rgba(255,255,255,0.4)',
              color: 'var(--color-canvas-white)',
            }}
          >
            DESCARGAR MATLAB
          </button>
        </div>

        {/* Hero stat tiles */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginTop: 8,
          }}
        >
          <HeroStat value="500" label="ANTENAS" />
          <HeroStat value="500" label="CLIENTES" />
          <HeroStat value="4" label="MÉTODOS" />
          <HeroStat value="0.84%" label="GAP FINAL" />
        </div>
      </div>

      {/* Scroll indicator ↓ */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 36,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'none',
          animation: 'heroScrollFade 2.2s cubic-bezier(0.32,0.72,0,1) infinite',
        }}
      >
        <span
          className="t-caption"
          style={{ color: 'rgba(255,255,255,0.35)', fontSize: 18, lineHeight: 1 }}
        >
          ↓
        </span>
        <style>{`
          @keyframes heroScrollFade {
            0%, 100% { opacity: 0.35; transform: translateX(-50%) translateY(0); }
            50% { opacity: 0.7; transform: translateX(-50%) translateY(4px); }
          }
        `}</style>
      </div>
    </SceneAnchor>
  );
}
