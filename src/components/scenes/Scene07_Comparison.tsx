'use client';

import dynamic from 'next/dynamic';
import { useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtTime, fmtPct } from '@/lib/results';

gsap.registerPlugin(ScrollTrigger);

const ComparisonCompareDrag = dynamic(
  () => import('@/components/charts/ComparisonCompareDrag'),
  { ssr: false },
);

// ─── Animated bar chart ───────────────────────────────────────────────────────

type ViewMode = 'cost' | 'time';

const METHODS = ['LP (Cota)', 'Greedy', 'GA', 'ILP'];
const COSTS = [27860, 52063, 50546, 50123];
const TIMES = [0.183, 0.003, 43.95, 300.09];
const METHOD_COLORS = [
  'var(--color-grey-brown)',
  'var(--color-cork-shadow)',
  'var(--color-warm-cream)',
  'var(--color-burnt-sienna)',
];

function ComparisonBars({ mode }: { mode: ViewMode }) {
  const data = mode === 'cost' ? COSTS : TIMES;
  const max = Math.max(...data);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {METHODS.map((name, i) => {
        const pct = (data[i]! / max) * 100;
        return (
          <div key={name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="t-meta" style={{ color: 'var(--color-grey-brown)' }}>{name}</span>
              <span className="font-mono-num" style={{ fontSize: 12, color: 'var(--color-warm-cream)' }}>
                {mode === 'cost' ? fmtMoney(data[i]!) : fmtTime(data[i]!)}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--color-cork-shadow)', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: METHOD_COLORS[i],
                  transition: 'width 800ms cubic-bezier(0.32,0.72,0,1)',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Scene 07 ─────────────────────────────────────────────────────────────────

export function Scene07_Comparison() {
  const [mode, setMode] = useState<ViewMode>('cost');
  const { comparativa } = results;

  return (
    <SceneAnchor id="comparacion" n={7} ariaLabel="Comparación de los cuatro métodos" style={{ background: 'var(--color-studio-black)' }}>
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal>
          <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 32 }}>07 · COMPARACIÓN</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="t-display-xl" style={{ color: 'var(--color-warm-cream)', margin: '0 0 clamp(40px,6vh,72px)', maxWidth: 900 }}>
            Cuatro métodos.<br />Una decisión.
          </h2>
        </Reveal>

        {/* Drag compare */}
        <Reveal delay={0.08} variant="fade">
          <ComparisonCompareDrag />
        </Reveal>

        <div className="div-dashed" style={{ margin: 'clamp(40px,6vh,80px) 0' }} />

        {/* Toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {([['cost', 'COSTO'], ['time', 'TIEMPO']] as [ViewMode, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setMode(v)}
              className={mode === v ? 'btn-pill' : 'btn-ghost'}
              style={{ fontSize: 11 }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dashboard table + bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start' }}>
          {/* Table */}
          <Reveal>
            <div>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid color-mix(in srgb, var(--color-warm-cream) 15%, transparent)', paddingBottom: 12, marginBottom: 0 }}>
                {METHODS.map((m, i) => (
                  <div key={m} style={{ padding: '0 8px', borderLeft: i > 0 ? '1px solid var(--color-cork-shadow)' : undefined }}>
                    <div className="t-meta" style={{ color: 'var(--color-grey-brown)' }}>{m}</div>
                  </div>
                ))}
              </div>
              {/* Rows */}
              {[
                { label: 'COSTO', vals: comparativa.costo.map((c) => fmtMoney(c)) },
                { label: 'TIEMPO', vals: comparativa.tiempo_s.map((t) => fmtTime(t)) },
                { label: 'ANTENAS', vals: ['—', '23', '23', '22'] },
                { label: 'GARANTÍA', vals: ['Cota inf.', 'No', 'No', 'Sí'] },
              ].map(({ label, vals }) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px dashed var(--color-cork-shadow)', padding: '14px 0' }}>
                  {vals.map((v, i) => (
                    <div key={i} style={{ padding: '0 8px', borderLeft: i > 0 ? '1px dashed var(--color-cork-shadow)' : undefined }}>
                      <div className="font-mono-num" style={{ fontSize: 13, color: i === 3 ? 'var(--color-burnt-sienna)' : 'var(--color-warm-cream)' }}>{v}</div>
                      {i === 0 && <div className="t-meta" style={{ color: 'var(--color-grey-brown)', marginTop: 2 }}>{label}</div>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>

          {/* Bars */}
          <Reveal delay={0.1}>
            <ComparisonBars mode={mode} />
          </Reveal>
        </div>
      </div>
    </SceneAnchor>
  );
}
