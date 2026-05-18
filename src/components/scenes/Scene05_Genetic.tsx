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

// ─── CountUp ─────────────────────────────────────────────────────────────────
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

// ─── GA ingredient cards — translucent overlay for dark section ───────────────
const GA_INGREDIENTS = [
  { id: 'pop', label: 'POBLACIÓN', value: '150', desc: 'cromosomas por generación' },
  { id: 'gen', label: 'GENERACIONES', value: '500', desc: 'iteraciones del ciclo evolutivo' },
  { id: 'cross', label: 'CRUCE', value: '90%', desc: 'probabilidad de recombinación' },
  { id: 'mut', label: 'MUTACIÓN', value: '3%→0.5%', desc: 'mutación adaptativa decreciente' },
  { id: 'elit', label: 'ELITISMO', value: '3', desc: 'mejores individuos preservados' },
  { id: 'sel', label: 'SELECCIÓN', value: 'Torneo', desc: 'presión selectiva controlada' },
  { id: 'fit', label: 'FITNESS', value: 'Costo', desc: 'objetivo: minimizar ∑ cⱼ xⱼ' },
  { id: 'seed', label: 'SEMILLA', value: '13', desc: 'mejor corrida de 5 experimentos' },
];

const GA_SNIPPET = `% Algoritmo Genético — ciclo principal (MATLAB)
for gen = 1:max_gen
    % Evaluación fitness
    fitness = arrayfun(@(i) evalFitness(pop(i,:), costos, A, b), 1:pop_size);

    % Elitismo — preservar los mejores
    [~, idx] = sort(fitness);
    nuevaPop(1:elitism,:) = pop(idx(1:elitism),:);

    % Selección por torneo + cruce + mutación
    for k = elitism+1:2:pop_size
        p1 = torneo(pop, fitness, t_size);
        p2 = torneo(pop, fitness, t_size);
        [h1, h2] = cruce(p1, p2, p_cross);
        nuevaPop(k,:)   = mutar(h1, p_mut_actual);
        nuevaPop(k+1,:) = mutar(h2, p_mut_actual);
    end

    pop = nuevaPop;
    p_mut_actual = p_mut_ini * exp(-lambda * gen); % mutación adaptativa
    mejor(gen) = min(fitness);
end`;

function IngredientCard({
  item, stackIndex, progress,
}: { item: typeof GA_INGREDIENTS[0]; stackIndex: number; progress: number }) {
  const threshold = stackIndex / GA_INGREDIENTS.length;
  const visible = progress > threshold;
  const offset = Math.max(0, 1 - (progress - threshold) * GA_INGREDIENTS.length) * 40;
  return (
    <div
      className="card-hero-overlay"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translateY(${offset}px)`,
        transition: 'opacity 400ms cubic-bezier(0.32,0.72,0,1), transform 500ms cubic-bezier(0.32,0.72,0,1)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '14px 20px',
      }}
    >
      <div style={{ minWidth: 72 }}>
        <div
          className="font-mono tnum"
          style={{ fontSize: 18, color: 'var(--color-action-azure)', fontWeight: 500 }}
        >
          {item.value}
        </div>
      </div>
      <div>
        <div className="t-caption tracking-meta" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>
          {item.label}
        </div>
        <div className="t-body" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.desc}</div>
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

  const resultRows = [
    { label: 'MEJOR COSTO (GA)', value: fmtMoney(ga_refinado.costo) },
    { label: 'ANTENAS SELECCIONADAS', value: `|S| = ${ga_refinado.sel_size}` },
    { label: 'TIEMPO DE CÓMPUTO', value: fmtTime(ga_refinado.tiempo_s) },
    { label: 'GAP vs EXACTO', value: fmtPct(ga_refinado.gap_vs_exacto_pct) },
  ];

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
          {/* WebGL population background */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.45, pointerEvents: 'none' }}
          >
            <div style={{ width: '100%', height: '100%' }}>
              <GeneticPopulationR3F progress={progress} className="w-full h-full" />
            </div>
          </div>

          {/* LEFT — text content */}
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
                maxWidth: '11ch',
                lineHeight: 1,
                fontWeight: 400,
                letterSpacing: '-0.022em',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.04em', whiteSpace: 'nowrap' }}>
                Evolución&nbsp;en&nbsp;2
                <span style={{ fontSize: '0.46em', lineHeight: 1, color: 'var(--color-action-azure)', marginTop: '0.06em', fontWeight: 500 }}>
                  500
                </span>
              </span>
              <br />
              dimensiones.
            </h2>
            <p
              className="t-body-lg"
              style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 40px', maxWidth: 400, lineHeight: 1.65 }}
            >
              150 cromosomas binarios de 500 bits compiten durante 500 generaciones.
              Selección por torneo, cruce de un punto, mutación adaptativa.
              Converge sin garantía de optimalidad — pero en 44 segundos.
            </p>
            {/* Result rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {resultRows.map(({ label, value }, i) => (
                <div
                  key={label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 16,
                    padding: '14px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    opacity: progress > i * 0.2 ? 1 : 0.2,
                    transition: 'opacity 400ms cubic-bezier(0.32,0.72,0,1)',
                  }}
                >
                  <span className="t-caption" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                  <span className="font-mono tnum t-h-sm" style={{ color: 'var(--color-canvas-white)' }}>{value}</span>
                </div>
              ))}
            </div>
            {/* Generation counter HUD */}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="t-caption" style={{ color: 'rgba(255,255,255,0.4)' }}>GEN</span>
              <span
                className="font-mono tnum"
                style={{ fontSize: 28, color: 'var(--color-action-azure)', fontWeight: 500 }}
              >
                {Math.round(progress * 500).toString().padStart(3, '0')}
              </span>
              <span className="t-caption" style={{ color: 'rgba(255,255,255,0.4)' }}>/ 500</span>
            </div>
          </div>

          {/* RIGHT — ingredient cards */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GA_INGREDIENTS.map((item, i) => (
              <IngredientCard key={item.id} item={item} stackIndex={i} progress={progress} />
            ))}
          </div>
        </div>
      </div>

      {/* Code block below pin — still dark */}
      <div style={{ padding: 'var(--section-gap) 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container-max" style={{ padding: '0 var(--gutter)' }}>
          <Reveal>
            <p
              className="t-caption tracking-meta"
              style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}
            >
              CICLO EVOLUTIVO — MATLAB
            </p>
          </Reveal>
          <pre className="hljs" style={{ overflow: 'auto', borderRadius: 12 }}>
            <code>{GA_SNIPPET}</code>
          </pre>
        </div>
      </div>
    </SceneAnchor>
  );
}
