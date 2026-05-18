'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtPct, fmtMoney } from '@/lib/results';

gsap.registerPlugin(ScrollTrigger);

// Graceful fallback if MatrixHeatmap not yet available
let MatrixHeatmap: React.ComponentType<{ progress?: number }>;
try {
  MatrixHeatmap = dynamic(() => import('@/components/visual/MatrixHeatmap').catch(() =>
    Promise.resolve({ default: ({ progress }: { progress?: number }) => (
      <div
        style={{
          width: '100%',
          height: 340,
          background: 'var(--color-off-white)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed var(--color-cool-gray)',
        }}
      >
        <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>
          MatrixHeatmap — {Math.round((progress ?? 0) * 100)}%
        </span>
      </div>
    ) })
  ), { ssr: false });
} catch {
  MatrixHeatmap = ({ progress }: { progress?: number }) => (
    <div style={{ width: '100%', height: 340, background: 'var(--color-off-white)', borderRadius: 12 }}>
      <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>
        {Math.round((progress ?? 0) * 100)}%
      </span>
    </div>
  );
}

// ─── CountUp ─────────────────────────────────────────────────────────────────
function CountUp({
  to, prefix = '', suffix = '', decimals = 0, duration = 1.4,
}: {
  to: number; prefix?: string; suffix?: string; decimals?: number; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const run = () => {
      if (triggered.current) return;
      triggered.current = true;
      if (prefersReduced) { el.textContent = prefix + to.toFixed(decimals) + suffix; return; }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / (duration * 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        el.textContent = prefix + (to * ease).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + to.toFixed(decimals) + suffix;
      };
      requestAnimationFrame(tick);
    };
    const obs = new IntersectionObserver(
      (e) => { if (e[0]?.isIntersecting) { run(); obs.disconnect(); } },
      { threshold: 0.2 },
    );
    obs.observe(el);
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) run();
    return () => obs.disconnect();
  }, [to, prefix, suffix, decimals, duration]);

  return (
    <span ref={ref} className="tnum font-mono">
      {prefix}{to.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── Scene 02 — LIGHT ────────────────────────────────────────────────────────
export function Scene02_Problem() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useGSAP(() => {
    if (!outerRef.current) return;
    ScrollTrigger.create({
      trigger: outerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
      onUpdate: (self) => setProgress(self.progress),
    });
  }, { scope: outerRef });

  const { eda } = results;

  const stats = [
    {
      label: 'Densidad',
      value: <CountUp to={parseFloat((eda.densidad_matriz * 100).toFixed(2))} decimals={2} suffix="%" />,
      caption: 'de la matriz A',
    },
    {
      label: 'Entradas iguales a 1',
      value: <CountUp to={eda.total_unos} />,
      caption: 'pares (cliente, antena)',
    },
    {
      label: 'Costo si todas activas',
      value: <CountUp to={eda.costo_total_si_seleccionara_todas} prefix="$" />,
      caption: 'cota superior trivial',
    },
    {
      label: 'Cota LP relajada',
      value: <CountUp to={Math.round(results.exacto.lp_relax_obj)} prefix="$" />,
      caption: 'cota inferior LP',
    },
  ];

  return (
    <SceneAnchor
      id="problema"
      n={2}
      ariaLabel="El problema — Set Cover 500×500"
      style={{ background: 'var(--color-canvas-white)' }}
    >
      <div ref={outerRef} style={{ position: 'relative', height: '220vh' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 var(--gutter)',
            justifyContent: 'center',
            overflow: 'hidden',
            gap: 32,
          }}
        >
          {/* Top row — headline + punch line */}
          <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 'var(--gutter)', alignItems: 'end' }}>
            <div>
              <p
                className="t-caption tracking-meta"
                style={{ color: 'var(--color-medium-gray)', marginBottom: 16 }}
              >
                02 · EL PROBLEMA
              </p>
              <h2
                className="font-serif t-h-lg"
                style={{
                  color: 'var(--color-dark-charcoal)',
                  margin: '0 0 16px',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                }}
              >
                Quinientas decisiones binarias.
              </h2>
              {/* Single punch line — was 2 paragraphs */}
              <p
                className="t-body"
                style={{ color: 'var(--color-slate-gray)', margin: 0, maxWidth: 380, lineHeight: 1.6 }}
              >
                Cada antena cubre un subconjunto. Encontrar la mínima cobertura es NP-difícil.
              </p>
            </div>
            {/* Progress scroll indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
              <div
                style={{
                  width: 120,
                  height: 2,
                  background: 'var(--color-cool-gray)',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(progress * 100)}%`,
                    background: 'var(--color-cofounder-blue)',
                    transition: 'width 80ms linear',
                    borderRadius: 1,
                  }}
                />
              </div>
              <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>
                A ∈ &#123;0,1&#125;<sup style={{ fontSize: '0.7em' }}>500×500</sup>
              </span>
            </div>
          </div>

          {/* Full-width MatrixHeatmap — 60% of scene */}
          <div
            style={{
              width: '100%',
              flex: 1,
              minHeight: 0,
              maxHeight: '55vh',
            }}
          >
            <MatrixHeatmap progress={progress} />
          </div>
        </div>
      </div>

      {/* Stats row — 4 card-medium BIGGER with CountUp display-size numbers */}
      <div
        style={{
          padding: 'var(--section-gap) var(--gutter)',
          background: 'var(--color-off-white)',
          borderTop: '1px solid var(--color-cool-gray)',
        }}
      >
        <div className="container-max">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {stats.map(({ label, value, caption }) => (
              <Reveal key={label}>
                <div className="card-medium" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div
                    style={{
                      fontSize: 'clamp(28px,3.5vw,44px)',
                      color: 'var(--color-dark-charcoal)',
                      lineHeight: 1.05,
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 500,
                    }}
                  >
                    {value}
                  </div>
                  <div className="div-accent" />
                  <p className="t-caption" style={{ color: 'var(--color-charcoal)', margin: 0, fontWeight: 500 }}>
                    {label}
                  </p>
                  <p className="t-caption" style={{ color: 'var(--color-medium-gray)', margin: 0 }}>
                    {caption}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </SceneAnchor>
  );
}
