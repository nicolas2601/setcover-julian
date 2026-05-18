'use client';

import dynamic from 'next/dynamic';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtPct } from '@/lib/results';

const SeedRobustnessChart = dynamic(() => import('@/components/charts/SeedRobustnessChart'), { ssr: false });

// ─── Seed table data ──────────────────────────────────────────────────────────
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

        <Reveal delay={0.05}>
          <h2
            className="font-serif t-h-lg"
            style={{
              color: 'var(--color-dark-charcoal)',
              margin: '0 0 clamp(40px,6vh,72px)',
              maxWidth: 900,
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            Estable. Pero honestamente estocástico.
          </h2>
        </Reveal>

        {/* Two-col layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'clamp(32px,5vw,80px)',
            alignItems: 'start',
            marginBottom: 'var(--section-gap)',
          }}
        >
          {/* LEFT — seed table in card-elevated */}
          <Reveal>
            <div className="card-elevated">
              <p
                className="t-caption tracking-meta"
                style={{ color: 'var(--color-medium-gray)', marginBottom: 20 }}
              >
                5 SEMILLAS · RESULTADOS INDIVIDUALES
              </p>
              {/* Header row */}
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
              {/* Seed rows */}
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
                    <span
                      className="font-mono tnum"
                      style={{ fontSize: 12, color: 'var(--color-slate-gray)', letterSpacing: '0.06em' }}
                    >
                      {s.seed}
                    </span>
                    <span
                      className="font-mono tnum"
                      style={{
                        fontSize: 14,
                        color: isOutlier ? 'var(--color-slate-gray)' : 'var(--color-dark-charcoal)',
                        fontWeight: isOutlier ? 400 : 500,
                      }}
                    >
                      {fmtMoney(s.cost)}
                    </span>
                    <span
                      className="font-mono tnum"
                      style={{
                        fontSize: 12,
                        color: isBest ? 'var(--color-cofounder-blue)' : 'var(--color-slate-gray)',
                        fontWeight: isBest ? 500 : 400,
                      }}
                    >
                      {fmtPct(s.gap)}
                    </span>
                    <span className="font-mono tnum" style={{ fontSize: 12, color: 'var(--color-slate-gray)' }}>
                      23
                    </span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* RIGHT — dot plot chart */}
          <Reveal delay={0.1} variant="scale">
            <div className="card-elevated">
              <p
                className="t-caption tracking-meta"
                style={{ color: 'var(--color-medium-gray)', marginBottom: 20 }}
              >
                DISTRIBUCIÓN DE COSTOS
              </p>
              <SeedRobustnessChart />
              <p className="t-caption" style={{ color: 'var(--color-medium-gray)', marginTop: 12, opacity: 0.7, lineHeight: 1.5 }}>
                Línea azul = ILP óptimo ($50,123) · Hover sobre puntos para detalles
              </p>
            </div>
          </Reveal>
        </div>

        {/* μ / σ / CV summary */}
        <div className="div-cool" style={{ marginBottom: 'clamp(32px,5vh,64px)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { sym: 'μ', label: 'MEDIA', value: fmtMoney(MEDIA) },
            { sym: 'σ', label: 'DESV. EST.', value: fmtMoney(Math.round(STD)) },
            { sym: 'CV', label: 'COEF. VAR.', value: fmtPct(CV) },
          ].map(({ sym, label, value }) => (
            <Reveal key={sym}>
              <div
                className="card-elevated"
                style={{ padding: 'clamp(24px,4vh,48px) clamp(20px,3vw,40px)' }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
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
                  <span className="font-serif t-h tnum" style={{ color: 'var(--color-dark-charcoal)', fontWeight: 400 }}>
                    {value}
                  </span>
                </div>
                <div className="div-accent" style={{ marginBottom: 10 }} />
                <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', margin: 0 }}>
                  {label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SceneAnchor>
  );
}
