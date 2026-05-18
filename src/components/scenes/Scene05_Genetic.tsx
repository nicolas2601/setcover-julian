'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtTime, fmtPct } from '@/lib/results';

gsap.registerPlugin(ScrollTrigger);

const GeneticPopulationR3F = dynamic(
  () => import('@/components/visual/GeneticPopulationR3F'),
  { ssr: false },
);

// ─── CountUp — used for live cost counter ─────────────────────────────────────
function CountUpLive({ from, to, progress, prefix = '' }: { from: number; to: number; progress: number; prefix?: string }) {
  const value = Math.round(from + (to - from) * Math.min(1, progress * 2));
  return (
    <span className="tnum font-mono">
      {prefix}{value.toLocaleString('es-CO')}
    </span>
  );
}

function CountUp({ to, prefix = '', suffix = '', decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const run = () => {
      if (triggered.current) return; triggered.current = true;
      if (prefersReduced) { el.textContent = prefix + to.toFixed(decimals) + suffix; return; }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / 1400, 1);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        el.textContent = prefix + (to * ease).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick); else el.textContent = prefix + to.toFixed(decimals) + suffix;
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
  }, [to, prefix, suffix, decimals]);
  return <span ref={ref} className="tnum font-mono">{prefix}{to.toFixed(decimals)}{suffix}</span>;
}

// ─── 4 GA ingredient cards (reduced from 8) — bigger cards ───────────────────
const GA_INGREDIENTS_4 = [
  { id: 'pop',   label: 'POP',   value: '150',      desc: 'cromosomas por generación' },
  { id: 'gen',   label: 'GEN',   value: '500',      desc: 'iteraciones evolutivas' },
  { id: 'cross', label: 'CROSS', value: '90%',      desc: 'probabilidad de cruce' },
  { id: 'mut',   label: 'MUT',   value: '3%→0.5%',  desc: 'mutación adaptativa' },
];

// ─── 6-line focused code snippet ─────────────────────────────────────────────
const GA_SNIPPET_SHORT = `for gen = 1:max_gen
    fitness = arrayfun(@(i) evalFitness(pop(i,:), costos, A, b), 1:pop_size);
    [~, idx] = sort(fitness);
    nuevaPop(1:elitism,:) = pop(idx(1:elitism),:);
    % Torneo + cruce + mutación adaptativa
    p_mut_actual = p_mut_ini * exp(-lambda * gen);
end`;

function IngredientCard({
  item, stackIndex, progress,
}: { item: typeof GA_INGREDIENTS_4[0]; stackIndex: number; progress: number }) {
  const threshold = stackIndex / GA_INGREDIENTS_4.length;
  const visible = progress > threshold;
  const offset = Math.max(0, 1 - (progress - threshold) * GA_INGREDIENTS_4.length) * 36;
  return (
    <div
      className="card-hero-overlay"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${offset}px)`,
        transition: 'opacity 400ms cubic-bezier(0.32,0.72,0,1), transform 500ms cubic-bezier(0.32,0.72,0,1)',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '20px 28px',
      }}
    >
      <div style={{ minWidth: 80 }}>
        <div
          className="font-mono tnum"
          style={{ fontSize: 22, color: 'var(--color-action-azure)', fontWeight: 500, lineHeight: 1.2 }}
        >
          {item.value}
        </div>
      </div>
      <div>
        <div className="t-caption tracking-meta" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
          {item.label}
        </div>
        <div className="t-body" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{item.desc}</div>
      </div>
    </div>
  );
}

// ─── Scene 05 — DARK (contrast interlude) ────────────────────────────────────
export function Scene05_Genetic() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const { ga_refinado } = results;

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

  return (
    <SceneAnchor
      id="genetico"
      n={5}
      ariaLabel="Algoritmo Genético — evolución en 2^500 dimensiones"
      className="dark-section"
      style={{ background: 'var(--color-night-sky)' }}
    >
      <div ref={outerRef} style={{ position: 'relative', height: '250vh' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '5fr 7fr',
            gap: 'var(--gutter)',
            padding: '0 var(--gutter)',
            alignItems: 'center',
          }}
        >
          {/* WebGL population — 60% width covers right column naturally */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}
          >
            <div style={{ width: '100%', height: '100%' }}>
              <GeneticPopulationR3F progress={progress} className="w-full h-full" />
            </div>
          </div>

          {/* LEFT — headline + live cost counter (no body paragraph) */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p
              className="t-caption tracking-meta"
              style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}
            >
              05 · ALGORITMO GENÉTICO
            </p>
            <h2
              className="font-serif t-display"
              style={{
                color: 'var(--color-canvas-white)',
                margin: '0 0 28px',
                maxWidth: '14ch',
                lineHeight: 1,
                fontWeight: 400,
                letterSpacing: '-0.022em',
              }}
            >
              Evolución,
              <br />
              <em style={{ fontStyle: 'italic', color: 'var(--color-action-azure)' }}>
                no enumeración.
              </em>
            </h2>

            {/* Generation counter HUD */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 24 }}>
              <span className="t-caption" style={{ color: 'rgba(255,255,255,0.4)' }}>GEN</span>
              <span
                className="font-mono tnum"
                style={{ fontSize: 40, color: 'var(--color-action-azure)', fontWeight: 500, lineHeight: 1 }}
              >
                {Math.round(progress * 500).toString().padStart(3, '0')}
              </span>
              <span className="t-caption" style={{ color: 'rgba(255,255,255,0.4)' }}>/ 500</span>
            </div>

            {/* Live "best cost" counter animating as user scrolls */}
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                padding: '16px 20px',
                marginBottom: 28,
              }}
            >
              <div className="t-caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>
                MEJOR COSTO ACTUAL
              </div>
              <div style={{ fontSize: 'clamp(24px,3.2vw,40px)', color: 'var(--color-canvas-white)', fontWeight: 500 }}>
                $<CountUpLive from={65800} to={50546} progress={progress} />
              </div>
            </div>

            {/* Quick metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'TIEMPO', value: fmtTime(ga_refinado.tiempo_s) },
                { label: 'GAP vs ILP', value: fmtPct(ga_refinado.gap_vs_exacto_pct) },
              ].map(({ label, value }) => (
                <div key={label} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
                  <div className="t-caption" style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
                  <div className="font-mono tnum" style={{ fontSize: 18, color: 'var(--color-canvas-white)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — 4 bigger ingredient cards */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {GA_INGREDIENTS_4.map((item, i) => (
              <IngredientCard key={item.id} item={item} stackIndex={i} progress={progress} />
            ))}
          </div>
        </div>
      </div>

      {/* Code block below pin — 6 focused lines */}
      <div style={{ padding: 'var(--section-gap) 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container-max" style={{ padding: '0 var(--gutter)' }}>
          <Reveal>
            <p
              className="t-caption tracking-meta"
              style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}
            >
              CICLO EVOLUTIVO — MATLAB (LÍNEAS CLAVE)
            </p>
          </Reveal>
          <pre className="hljs" style={{ overflow: 'auto', borderRadius: 12 }}>
            <code>{GA_SNIPPET_SHORT}</code>
          </pre>
        </div>
      </div>
    </SceneAnchor>
  );
}
