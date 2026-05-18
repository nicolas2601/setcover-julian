'use client';

import dynamic from 'next/dynamic';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtPct } from '@/lib/results';

const ConvergenceChart = dynamic(() => import('@/components/charts/ConvergenceChart'), { ssr: false });

// ─── 3 KPI cards below chart ─────────────────────────────────────────────────
const KPI_CARDS = [
  { label: 'ESTABILIZA EN', value: 'GEN 200–250', sub: 'plateau de explotación' },
  { label: 'GAP FINAL', value: '0.844%', sub: 'vs óptimo exacto $50,123' },
  { label: 'MEJOR SEMILLA', value: '#13', sub: 'de 5 corridas independientes' },
];

// ─── Scene 06 — LIGHT — chart-first ──────────────────────────────────────────
export function Scene06_Convergence() {
  const { ga, exacto } = results;

  const mu = ga.media_5_corridas ?? 0;
  const sigma = ga.std_5_corridas ?? 0;
  const cv = mu > 0 ? (sigma / mu) * 100 : 0;

  return (
    <SceneAnchor
      id="convergencia"
      n={6}
      ariaLabel="Convergencia del Algoritmo Genético"
      style={{ background: 'var(--color-off-white)' }}
    >
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        {/* Header */}
        <Reveal>
          <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 32 }}>
            06 · CONVERGENCIA
          </p>
        </Reveal>

        {/* Title + 1-line body side by side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '7fr 5fr',
            gap: 'clamp(24px,4vw,64px)',
            marginBottom: 'clamp(32px,5vh,64px)',
            alignItems: 'end',
          }}
        >
          <Reveal delay={0.05}>
            <h2
              className="font-serif t-display-xl"
              style={{
                color: 'var(--color-dark-charcoal)',
                margin: 0,
                fontWeight: 400,
                letterSpacing: '-0.025em',
              }}
            >
              Convergencia.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            {/* Cut to 1 line — was 2 sentences */}
            <p className="t-body" style={{ color: 'var(--color-slate-gray)', margin: 0, lineHeight: 1.6 }}>
              500 generaciones, caída de $65,800 a $50,546. Gap final: 0.84%.
            </p>
          </Reveal>
        </div>

        {/* Chart — full-bleed 100% width */}
        <Reveal variant="scale" delay={0.05}>
          <div
            className="card-elevated"
            style={{ padding: 'clamp(16px,2.5vw,32px)', width: '100%' }}
          >
            <ConvergenceChart />
          </div>
        </Reveal>

        <div className="div-cool" style={{ margin: 'clamp(32px,5vh,64px) 0' }} />

        {/* 3 KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(12px,2vw,28px)', marginBottom: 'clamp(32px,5vh,64px)' }}>
          {KPI_CARDS.map((card) => (
            <Reveal key={card.label} delay={0.05}>
              <div className="card-medium" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  className="font-mono tnum"
                  style={{
                    fontSize: 'clamp(20px,2.5vw,32px)',
                    color: 'var(--color-cofounder-blue)',
                    fontWeight: 500,
                    lineHeight: 1.1,
                  }}
                >
                  {card.value}
                </div>
                <div className="div-accent" />
                <p className="t-caption" style={{ color: 'var(--color-charcoal)', margin: 0, fontWeight: 500 }}>
                  {card.label}
                </p>
                <p className="t-caption" style={{ color: 'var(--color-medium-gray)', margin: 0 }}>
                  {card.sub}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* μ / σ / CV big display */}
        <div className="div-cool" style={{ marginBottom: 'clamp(24px,4vh,48px)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { sym: 'μ', label: 'MEDIA 5 CORRIDAS', value: fmtMoney(mu) },
            { sym: 'σ', label: 'DESVIACIÓN ESTÁNDAR', value: fmtMoney(sigma) },
            { sym: 'CV', label: 'COEF. VARIACIÓN', value: fmtPct(cv) },
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
                      fontSize: 'clamp(56px,7vw,80px)',
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
