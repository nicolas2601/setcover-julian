'use client';

import { useState } from 'react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtPct } from '@/lib/results';

// ─── Seed table ───────────────────────────────────────────────────────────────

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
const EXACT = results.exacto.costo;

// ─── Dot plot SVG ─────────────────────────────────────────────────────────────

function SeedRobustnessChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const minCost = 49000;
  const maxCost = 53500;
  const W = 340;
  const H = 200;
  const PAD = { top: 20, right: 20, bottom: 32, left: 20 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const toX = (c: number) => PAD.left + ((c - minCost) / (maxCost - minCost)) * plotW;
  const toY = (i: number) => PAD.top + (i / (SEEDS.length - 1)) * plotH;

  const exactX = toX(EXACT);
  const medX = toX(MEDIA);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} aria-label="Dot plot de robustez por semilla">
      {/* Grid lines */}
      {[50000, 51000, 52000].map((v) => {
        const x = toX(v).toFixed(2);
        return (
          <g key={v}>
            <line x1={x} y1={PAD.top.toFixed(2)} x2={x} y2={(PAD.top + plotH).toFixed(2)} stroke="var(--color-cork-shadow)" strokeWidth="0.5" strokeDasharray="3 3" />
            <text x={x} y={(PAD.top + plotH + 14).toFixed(2)} fontSize="8" fill="var(--color-grey-brown)" textAnchor="middle">{`$${v / 1000}k`}</text>
          </g>
        );
      })}

      {/* ILP optimal reference */}
      <line x1={exactX.toFixed(2)} y1={PAD.top.toFixed(2)} x2={exactX.toFixed(2)} y2={(PAD.top + plotH).toFixed(2)} stroke="var(--color-burnt-sienna)" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
      <text x={(exactX + 3).toFixed(2)} y={(PAD.top - 5).toFixed(2)} fontSize="7.5" fill="var(--color-burnt-sienna)">ILP</text>

      {/* Mean reference */}
      <line x1={medX.toFixed(2)} y1={PAD.top.toFixed(2)} x2={medX.toFixed(2)} y2={(PAD.top + plotH).toFixed(2)} stroke="var(--color-warm-cream)" strokeWidth="0.5" opacity="0.4" />

      {/* Seed dots */}
      {SEEDS.map((s, i) => {
        const x = toX(s.cost);
        const y = toY(i);
        const isHov = hovered === i;
        return (
          <g key={s.seed} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
            <circle cx={x.toFixed(2)} cy={y.toFixed(2)} r={isHov ? 6 : 4.5} fill={s.seed === 'S4' ? 'var(--color-grey-brown)' : 'var(--color-warm-cream)'} opacity={isHov ? 1 : 0.8} style={{ transition: 'r 200ms, opacity 200ms' }} />
            <text x={(x - 14).toFixed(2)} y={(y + 0.5).toFixed(2)} fontSize="8" fill="var(--color-grey-brown)" dominantBaseline="middle">{s.seed}</text>
            {isHov && (
              <g>
                <rect x={(x + 8).toFixed(2)} y={(y - 18).toFixed(2)} width="72" height="28" rx="3" fill="var(--color-dark-cork)" stroke="var(--color-cork-shadow)" strokeWidth="0.5" />
                <text x={(x + 12).toFixed(2)} y={(y - 8).toFixed(2)} fontSize="7.5" fill="var(--color-warm-cream)">{fmtMoney(s.cost)}</text>
                <text x={(x + 12).toFixed(2)} y={(y + 4).toFixed(2)} fontSize="7" fill="var(--color-grey-brown)">Gap {fmtPct(s.gap)}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Scene 08 ─────────────────────────────────────────────────────────────────

export function Scene08_Robustness() {
  return (
    <SceneAnchor id="robustez" n={8} ariaLabel="Robustez del Algoritmo Genético — análisis de semillas" style={{ background: 'var(--color-studio-black)' }}>
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal>
          <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 32 }}>08 · ROBUSTEZ</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="t-display-xl" style={{ color: 'var(--color-warm-cream)', margin: '0 0 clamp(40px,6vh,72px)', maxWidth: 900 }}>
            Estable. Pero honestamente estocástico.
          </h2>
        </Reveal>

        {/* Two-col layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start', marginBottom: 'var(--section-gap)' }}>
          {/* LEFT — seed table */}
          <Reveal>
            <div>
              <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 20 }}>5 SEMILLAS · RESULTADOS INDIVIDUALES</p>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 16, paddingBottom: 10, borderBottom: '1px solid color-mix(in srgb, var(--color-warm-cream) 12%, transparent)', marginBottom: 0 }}>
                  {['SEMILLA', 'COSTO', 'GAP VS ILP', '|S|'].map((h) => (
                    <span key={h} className="t-meta" style={{ color: 'var(--color-grey-brown)' }}>{h}</span>
                  ))}
                </div>
                {SEEDS.map((s) => (
                  <div key={s.seed} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 16, padding: '12px 0', borderBottom: '1px dashed var(--color-cork-shadow)', alignItems: 'center' }}>
                    <span className="font-mono-num" style={{ fontSize: 11, color: 'var(--color-grey-brown)', letterSpacing: '0.08em' }}>{s.seed}</span>
                    <span className="font-mono-num" style={{ fontSize: 14, color: s.seed === 'S4' ? 'var(--color-grey-brown)' : 'var(--color-warm-cream)' }}>{fmtMoney(s.cost)}</span>
                    <span className="font-mono-num" style={{ fontSize: 12, color: s.gap < 1 ? 'var(--color-burnt-sienna)' : 'var(--color-grey-brown)' }}>{fmtPct(s.gap)}</span>
                    <span className="font-mono-num" style={{ fontSize: 12, color: 'var(--color-grey-brown)' }}>23</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* RIGHT — dot plot */}
          <Reveal delay={0.1} variant="scale">
            <div>
              <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 20 }}>DISTRIBUCIÓN DE COSTOS</p>
              <SeedRobustnessChart />
              <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginTop: 12, opacity: 0.7 }}>
                Línea naranja = ILP óptimo ($50,123) · Hover sobre puntos para detalles
              </p>
            </div>
          </Reveal>
        </div>

        {/* μ / σ / CV */}
        <div className="div-dashed" style={{ marginBottom: 'clamp(32px,5vh,64px)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'var(--color-cork-shadow)' }}>
          {[
            { sym: 'μ', label: 'MEDIA', value: fmtMoney(MEDIA) },
            { sym: 'σ', label: 'DESV. EST.', value: fmtMoney(Math.round(STD)) },
            { sym: 'CV', label: 'COEF. VAR.', value: fmtPct(CV) },
          ].map(({ sym, label, value }) => (
            <Reveal key={sym}>
              <div style={{ background: 'var(--color-studio-black)', padding: 'clamp(24px,4vh,48px) clamp(20px,3vw,40px)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
                  <span className="t-display-xl" style={{ color: 'color-mix(in srgb, var(--color-warm-cream) 10%, transparent)', lineHeight: 0.84 }}>{sym}</span>
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
