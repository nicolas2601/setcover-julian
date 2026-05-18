'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtTime, fmtPct } from '@/lib/results';

const ComparisonBars = dynamic(() => import('@/components/charts/ComparisonBars'), { ssr: false });
const TimeLogChart = dynamic(() => import('@/components/charts/TimeLogChart'), { ssr: false });

// ─── Method card data ─────────────────────────────────────────────────────────
type MethodData = {
  key: string;
  name: string;
  subtitle: string;
  cost: number;
  size: string;
  time: number;
  gap: string;
  guarantee: string;
  isWinner: boolean;
};

const METHODS_DATA: MethodData[] = [
  {
    key: 'lp',
    name: 'LP Relajado',
    subtitle: 'Cota inferior',
    cost: results.comparativa.costo[0] ?? 27860,
    size: '—',
    time: results.comparativa.tiempo_s[0] ?? 0.183,
    gap: '—',
    guarantee: 'Cota inf.',
    isWinner: false,
  },
  {
    key: 'greedy',
    name: 'Greedy',
    subtitle: 'Heurístico rápido',
    cost: results.comparativa.costo[1] ?? 52063,
    size: '23',
    time: results.comparativa.tiempo_s[1] ?? 0.003,
    gap: fmtPct(((52063 - 50123) / 50123) * 100),
    guarantee: 'No',
    isWinner: false,
  },
  {
    key: 'ga',
    name: 'Algoritmo Genético',
    subtitle: 'Metaheurístico — ganador práctico',
    cost: results.comparativa.costo[2] ?? 50546,
    size: '23',
    time: results.comparativa.tiempo_s[2] ?? 43.95,
    gap: fmtPct(results.ga_refinado.gap_vs_exacto_pct),
    guarantee: 'No',
    isWinner: true, // THE COFOUNDER CARD
  },
  {
    key: 'ilp',
    name: 'ILP Exacto',
    subtitle: 'Branch & Bound',
    cost: results.comparativa.costo[3] ?? 50123,
    size: '22',
    time: results.comparativa.tiempo_s[3] ?? 300.09,
    gap: '0.00%',
    guarantee: 'Sí',
    isWinner: false,
  },
];

// ─── Method card — elevated (3 normal) or cofounder (GA winner) ───────────────
function MethodCard({ data }: { data: MethodData }) {
  if (data.isWinner) {
    // .card-cofounder — THE one blue card on this page
    return (
      <div
        className="card-cofounder"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: 'clamp(28px,4vw,40px) clamp(20px,3vw,32px)',
        }}
      >
        <div>
          <p className="t-caption tracking-meta" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
            GANADOR PRÁCTICO
          </p>
          <h3
            className="font-serif t-h-sm"
            style={{ color: 'var(--color-canvas-white)', margin: '0 0 4px', fontWeight: 400 }}
          >
            {data.name}
          </h3>
          <p className="t-caption" style={{ color: 'rgba(255,255,255,0.65)', margin: 0 }}>
            {data.subtitle}
          </p>
        </div>
        <div className="div-hairline" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        <div>
          <div
            className="font-mono tnum"
            style={{ fontSize: 'clamp(28px,3.5vw,44px)', color: 'var(--color-canvas-white)', fontWeight: 500, lineHeight: 1.1 }}
          >
            {fmtMoney(data.cost)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-caption" style={{ color: 'rgba(255,255,255,0.55)' }}>|S|</span>
            <span className="t-caption font-mono tnum" style={{ color: 'var(--color-canvas-white)' }}>{data.size}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-caption" style={{ color: 'rgba(255,255,255,0.55)' }}>TIEMPO</span>
            <span className="t-caption font-mono tnum" style={{ color: 'var(--color-canvas-white)' }}>{fmtTime(data.time)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-caption" style={{ color: 'rgba(255,255,255,0.55)' }}>GAP</span>
            <span className="t-caption font-mono tnum" style={{ color: 'rgba(255,255,255,0.9)' }}>{data.gap}</span>
          </div>
        </div>
      </div>
    );
  }

  // .card-elevated — normal methods
  return (
    <div
      className="card-elevated"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <div>
        <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 6 }}>
          {data.key.toUpperCase()}
        </p>
        <h3
          className="font-serif t-h-sm"
          style={{ color: 'var(--color-dark-charcoal)', margin: '0 0 4px', fontWeight: 400 }}
        >
          {data.name}
        </h3>
        <p className="t-caption" style={{ color: 'var(--color-slate-gray)', margin: 0 }}>
          {data.subtitle}
        </p>
      </div>
      <div className="div-cool" />
      <div>
        <div
          className="font-mono tnum"
          style={{
            fontSize: 'clamp(24px,3vw,36px)',
            color: 'var(--color-dark-charcoal)',
            fontWeight: 500,
            lineHeight: 1.1,
          }}
        >
          {fmtMoney(data.cost)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>|S|</span>
          <span className="t-caption font-mono tnum" style={{ color: 'var(--color-charcoal)' }}>{data.size}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>TIEMPO</span>
          <span className="t-caption font-mono tnum" style={{ color: 'var(--color-charcoal)' }}>{fmtTime(data.time)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>GAP</span>
          <span className="t-caption font-mono tnum" style={{ color: 'var(--color-dark-charcoal)', fontWeight: 500 }}>{data.gap}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>GARANTÍA</span>
          <span className="t-caption font-mono tnum" style={{ color: 'var(--color-charcoal)' }}>{data.guarantee}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Scene 07 — LIGHT — MAIN MOMENT ─────────────────────────────────────────
export function Scene07_Comparison() {
  return (
    <SceneAnchor
      id="comparacion"
      n={7}
      ariaLabel="Comparación de los cuatro métodos"
      style={{ background: 'var(--color-canvas-white)' }}
    >
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal>
          <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 32 }}>
            07 · COMPARACIÓN
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            className="font-serif t-display-xl"
            style={{
              color: 'var(--color-dark-charcoal)',
              margin: '0 0 clamp(40px,6vh,72px)',
              maxWidth: 900,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          >
            Cuatro métodos.<br />Una decisión.
          </h2>
        </Reveal>

        {/* 4-col method cards — ONE cofounder, THREE elevated */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 'clamp(48px,7vh,96px)',
          }}
        >
          {METHODS_DATA.map((data) => (
            <Reveal key={data.key} delay={0.06}>
              <MethodCard data={data} />
            </Reveal>
          ))}
        </div>

        <div className="div-cool" style={{ marginBottom: 'clamp(32px,5vh,64px)' }} />

        {/* ComparisonBars + TimeLogChart side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(24px,4vw,64px)', alignItems: 'start' }}>
          <Reveal delay={0.05}>
            <div>
              <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 16 }}>
                COMPARACIÓN DE COSTOS
              </p>
              <div className="card-elevated" style={{ padding: 'clamp(16px,2vw,28px)' }}>
                <ComparisonBars />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 16 }}>
                TIEMPOS DE EJECUCIÓN (LOG)
              </p>
              <div className="card-elevated" style={{ padding: 'clamp(16px,2vw,28px)' }}>
                <TimeLogChart />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </SceneAnchor>
  );
}
