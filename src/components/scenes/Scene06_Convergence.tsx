'use client';

import dynamic from 'next/dynamic';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtPct } from '@/lib/results';

const ConvergenceChart = dynamic(() => import('@/components/charts/ConvergenceChart'), { ssr: false });

const ANNOTATION_CARDS = [
  {
    num: '01',
    title: 'Caída rápida',
    body: 'En las primeras 50 generaciones el costo cae de ~$65,800 a ~$52,000. La diversidad inicial del GA permite saltos grandes.',
  },
  {
    num: '02',
    title: 'Plateau de explotación',
    body: 'Entre gen 100–400 la mejora es marginal. El algoritmo explota vecindades conocidas. La mutación adaptativa mantiene diversidad.',
  },
  {
    num: '03',
    title: 'Solución final',
    body: `$${Math.round(results.ga_refinado.costo).toLocaleString('es-CO')} en gen 500. Gap de 0.84% respecto al óptimo exacto de $${Math.round(results.exacto.costo).toLocaleString('es-CO')}.`,
  },
];

// ─── Scene 06 — LIGHT ────────────────────────────────────────────────────────
export function Scene06_Convergence() {
  const { ga_refinado, ga, exacto } = results;

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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '7fr 5fr',
            gap: 'clamp(32px,5vw,80px)',
            marginBottom: 'clamp(48px,7vh,96px)',
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
              El GA converge.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="t-body-lg" style={{ color: 'var(--color-charcoal)', margin: 0, maxWidth: 440, lineHeight: 1.65 }}>
              500 generaciones de evolución. El mejor individuo cae de $65,800 inicial
              hasta $50,546 — a 0.84% del óptimo exacto garantizado.
            </p>
          </Reveal>
        </div>

        {/* Chart — wrapped in card-elevated for light theme */}
        <Reveal variant="scale" delay={0.05}>
          <div className="card-elevated" style={{ padding: 'clamp(20px,3vw,36px)' }}>
            <ConvergenceChart />
          </div>
        </Reveal>

        <div className="div-cool" style={{ margin: 'clamp(40px,6vh,80px) 0' }} />

        {/* 3 annotation cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(16px,3vw,40px)' }}>
          {ANNOTATION_CARDS.map((card) => (
            <Reveal key={card.num} delay={0.05}>
              <div className="card-medium" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  className="font-mono tnum"
                  style={{ fontSize: 11, color: 'var(--color-medium-gray)', letterSpacing: '0.12em' }}
                >
                  {card.num}
                </div>
                <div className="div-accent" />
                <h3
                  className="font-serif t-h-sm"
                  style={{ color: 'var(--color-dark-charcoal)', margin: 0, fontWeight: 400 }}
                >
                  {card.title}
                </h3>
                <p className="t-body" style={{ color: 'var(--color-charcoal)', margin: 0, lineHeight: 1.6 }}>
                  {card.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="div-cool" style={{ margin: 'clamp(40px,6vh,80px) 0' }} />

        {/* μ / σ / CV big display — card-medium grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { sym: 'μ', label: 'MEDIA 5 CORRIDAS', value: fmtMoney(ga.media_5_corridas ?? 0) },
            { sym: 'σ', label: 'DESVIACIÓN ESTÁNDAR', value: fmtMoney(ga.std_5_corridas ?? 0) },
            {
              sym: 'CV',
              label: 'COEF. VARIACIÓN',
              value: fmtPct(((ga.std_5_corridas ?? 0) / (ga.media_5_corridas ?? 1)) * 100),
            },
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
