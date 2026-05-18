'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtPct } from '@/lib/results';

const SeedRobustnessChart = dynamic(() => import('@/components/charts/SeedRobustnessChart'), { ssr: false });

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

const SEEDS = [
  { seed: 'S1', cost: 50572, gap: 0.897 },
  { seed: 'S2', cost: 50546, gap: 0.844 },
  { seed: 'S3', cost: 50546, gap: 0.844 },
  { seed: 'S4', cost: 52063, gap: 3.870 },
  { seed: 'S5', cost: 51403, gap: 2.551 },
];

const MEDIA = results.ga.media_5_corridas ?? 51026;
const STD = results.ga.std_5_corridas ?? 613.9;
const CV = (STD / MEDIA) * 100;

// ─── Inline mini sparkline — 5 runs as horizontal bars ───────────────────────
function SeedSparkline() {
  const min = Math.min(...SEEDS.map((s) => s.cost));
  const max = Math.max(...SEEDS.map((s) => s.cost));
  const range = max - min || 1;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 40 }}>
      {SEEDS.map((s) => {
        const pct = ((s.cost - min) / range) * 100;
        const height = 12 + pct * 0.28;
        const isBest = s.gap < 1;
        return (
          <div key={s.seed} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div
              style={{
                width: 20,
                height,
                background: isBest ? 'var(--color-cofounder-blue)' : 'var(--color-cool-gray)',
                borderRadius: 3,
                transition: 'height 500ms cubic-bezier(0.32,0.72,0,1)',
              }}
            />
            <span className="font-mono" style={{ fontSize: 8, color: 'var(--color-medium-gray)' }}>
              {s.seed}
            </span>
          </div>
        );
      })}
      {/* Baseline reference line at optimal */}
      <div
        style={{
          position: 'absolute',
          width: 'calc(5 * 20px + 4 * 6px)',
          height: 1,
          background: 'var(--color-cofounder-blue)',
          opacity: 0.4,
          bottom: 13,
          left: 0,
        }}
      />
    </div>
  );
}

// ─── Scene 08 — LIGHT ────────────────────────────────────────────────────────
export function Scene08_Robustness() {
  return (
    <SceneAnchor
      id="robustez"
      n={8}
      ariaLabel="Robustez del Algoritmo Genético — análisis de semillas"
      style={{ background: 'var(--color-off-white)' }}
    >
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal>
          <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 32 }}>
            08 · ROBUSTEZ
          </p>
        </Reveal>

        {/* Title + 1-line body */}
        <Reveal delay={0.05}>
          <h2
            className="font-serif t-h-lg"
            style={{
              color: 'var(--color-dark-charcoal)',
              margin: '0 0 16px',
              maxWidth: 900,
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            Estable, pero honesto.
          </h2>
        </Reveal>
        <Reveal delay={0.07}>
          {/* 1-line body replacing paragraph */}
          <p className="t-body" style={{ color: 'var(--color-slate-gray)', margin: '0 0 clamp(32px,5vh,64px)', maxWidth: 480 }}>
            5 corridas independientes. CV = 1.2%.
          </p>
        </Reveal>

        {/* μ / σ / CV stat cards — BIG numbers + CountUp — moved ABOVE chart */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 'clamp(24px,4vh,48px)' }}>
          {[
            { sym: 'μ', label: 'MEDIA', value: MEDIA, prefix: '$', suffix: '', decimals: 0 },
            { sym: 'σ', label: 'DESV. EST.', value: Math.round(STD), prefix: '$', suffix: '', decimals: 0 },
            { sym: 'CV', label: 'COEF. VAR.', value: CV, prefix: '', suffix: '%', decimals: 2 },
          ].map(({ sym, label, value, prefix, suffix, decimals }) => (
            <Reveal key={sym}>
              <div
                className="card-elevated"
                style={{ padding: 'clamp(20px,3vh,40px) clamp(16px,2.5vw,36px)' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10 }}>
                  <span
                    className="font-serif"
                    style={{
                      fontSize: 'clamp(48px,6vw,72px)',
                      color: 'var(--color-cool-gray)',
                      lineHeight: 0.88,
                      fontWeight: 400,
                    }}
                  >
                    {sym}
                  </span>
                  <span
                    className="font-mono tnum"
                    style={{
                      fontSize: 'clamp(18px,2.2vw,28px)',
                      color: 'var(--color-dark-charcoal)',
                      fontWeight: 500,
                      lineHeight: 1.1,
                    }}
                  >
                    <CountUp to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
                  </span>
                </div>
                <div className="div-accent" style={{ marginBottom: 8 }} />
                <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', margin: 0 }}>
                  {label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Mini sparkline — 5 runs */}
        <Reveal delay={0.06}>
          <div
            className="card-medium"
            style={{ padding: '16px 20px', marginBottom: 'clamp(16px,2.5vh,32px)', display: 'flex', alignItems: 'center', gap: 24 }}
          >
            <div style={{ position: 'relative' }}>
              <SeedSparkline />
            </div>
            <div>
              <p className="t-caption" style={{ color: 'var(--color-medium-gray)', margin: 0 }}>
                Corridas S2 y S3 alcanzan el mejor resultado ($50,546). S4 es el outlier con gap 3.87%.
              </p>
            </div>
          </div>
        </Reveal>

        {/* SeedRobustnessChart — bigger, full width */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(24px,4vw,56px)', alignItems: 'start', marginBottom: 'var(--section-gap)' }}>
          {/* Left — seed table */}
          <Reveal>
            <div className="card-elevated">
              <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 20 }}>
                5 SEMILLAS · RESULTADOS INDIVIDUALES
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '56px 1fr 1fr 56px',
                  gap: 12,
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--color-cool-gray)',
                }}
              >
                {['SEMILLA', 'COSTO', 'GAP VS ILP', '|S|'].map((h) => (
                  <span key={h} className="t-caption" style={{ color: 'var(--color-medium-gray)', fontWeight: 500 }}>
                    {h}
                  </span>
                ))}
              </div>
              {SEEDS.map((s) => {
                const isOutlier = s.seed === 'S4';
                const isBest = s.gap < 1;
                return (
                  <div
                    key={s.seed}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '56px 1fr 1fr 56px',
                      gap: 12,
                      padding: '12px 0',
                      borderBottom: '1px solid var(--color-cool-gray)',
                      alignItems: 'center',
                    }}
                  >
                    <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--color-slate-gray)', letterSpacing: '0.06em' }}>
                      {s.seed}
                    </span>
                    <span
                      className="font-mono tnum"
                      style={{ fontSize: 14, color: isOutlier ? 'var(--color-slate-gray)' : 'var(--color-dark-charcoal)', fontWeight: isOutlier ? 400 : 500 }}
                    >
                      {fmtMoney(s.cost)}
                    </span>
                    <span
                      className="font-mono tnum"
                      style={{ fontSize: 12, color: isBest ? 'var(--color-cofounder-blue)' : 'var(--color-slate-gray)', fontWeight: isBest ? 500 : 400 }}
                    >
                      {fmtPct(s.gap)}
                    </span>
                    <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--color-slate-gray)' }}>23</span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Right — dot plot — bigger */}
          <Reveal delay={0.1} variant="scale">
            <div className="card-elevated">
              <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 20 }}>
                DISTRIBUCIÓN DE COSTOS
              </p>
              <SeedRobustnessChart />
              <p className="t-caption" style={{ color: 'var(--color-medium-gray)', marginTop: 12, opacity: 0.7, lineHeight: 1.5 }}>
                Línea azul = ILP óptimo ($50,123)
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </SceneAnchor>
  );
}
