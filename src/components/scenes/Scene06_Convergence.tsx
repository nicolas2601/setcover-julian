'use client';

import dynamic from 'next/dynamic';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtNumber, fmtPct } from '@/lib/results';

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

export function Scene06_Convergence() {
  const { ga_refinado } = results;

  return (
    <SceneAnchor id="convergencia" n={6} ariaLabel="Convergencia del Algoritmo Genético" style={{ background: 'var(--color-studio-black)' }}>
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        {/* Header */}
        <Reveal>
          <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 32 }}>06 · CONVERGENCIA</p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 'clamp(32px,5vw,80px)', marginBottom: 'clamp(48px,7vh,96px)', alignItems: 'end' }}>
          <Reveal delay={0.05}>
            <h2 className="t-display-xl" style={{ color: 'var(--color-warm-cream)', margin: 0 }}>El GA converge.</h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="t-body-lg" style={{ color: 'var(--color-grey-brown)', margin: 0, maxWidth: 440 }}>
              500 generaciones de evolución. El mejor individuo cae de $65,800 inicial
              hasta $50,546 — a 0.84% del óptimo exacto garantizado.
            </p>
          </Reveal>
        </div>

        {/* Chart */}
        <Reveal variant="scale" delay={0.05}>
          <ConvergenceChart />
        </Reveal>

        <div className="div-dashed" style={{ margin: 'clamp(40px,6vh,80px) 0' }} />

        {/* 3 annotation cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(20px,3vw,48px)' }}>
          {ANNOTATION_CARDS.map((card) => (
            <Reveal key={card.num} delay={0.05}>
              <div>
                <div className="div-accent" style={{ marginBottom: 16 }} />
                <div className="font-mono-num" style={{ fontSize: 11, color: 'var(--color-grey-brown)', marginBottom: 12, letterSpacing: '0.12em' }}>{card.num}</div>
                <h3 className="t-h-sm" style={{ color: 'var(--color-warm-cream)', margin: '0 0 12px' }}>{card.title}</h3>
                <p className="t-body" style={{ color: 'var(--color-grey-brown)', margin: 0 }}>{card.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="div-dashed" style={{ margin: 'clamp(40px,6vh,80px) 0' }} />

        {/* μ / σ / CV big display */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--color-cork-shadow)' }}>
          {[
            { sym: 'μ', label: 'MEDIA 5 CORRIDAS', value: fmtMoney(results.ga.media_5_corridas ?? 0) },
            { sym: 'σ', label: 'DESVIACIÓN ESTÁNDAR', value: fmtMoney(results.ga.std_5_corridas ?? 0) },
            { sym: 'CV', label: 'COEF. VARIACIÓN', value: fmtPct(((results.ga.std_5_corridas ?? 0) / (results.ga.media_5_corridas ?? 1)) * 100) },
          ].map(({ sym, label, value }) => (
            <Reveal key={sym}>
              <div style={{ background: 'var(--color-studio-black)', padding: 'clamp(24px,4vh,48px) clamp(20px,3vw,40px)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
                  <span className="t-display-xl" style={{ color: 'color-mix(in srgb, var(--color-warm-cream) 12%, transparent)', lineHeight: 0.84 }}>{sym}</span>
                  <span className="t-h font-mono-num" style={{ color: 'var(--color-warm-cream)' }}>{value}</span>
                </div>
                <div className="div-accent" style={{ marginBottom: 10 }} />
                <p className="t-meta" style={{ color: 'var(--color-grey-brown)', margin: 0 }}>{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SceneAnchor>
  );
}
