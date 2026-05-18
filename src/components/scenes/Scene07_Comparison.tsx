'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtTime, fmtPct } from '@/lib/results';

const ComparisonBars = dynamic(() => import('@/components/charts/ComparisonBars'), { ssr: false });

// Graceful fallback for new charts from parallel agent
const GapWaterfall = dynamic(
  () => import('@/components/charts/GapWaterfall').catch(() =>
    Promise.resolve({
      default: () => (
        <div style={{
          width: '100%', height: 200,
          background: 'var(--color-off-white)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed var(--color-cool-gray)',
        }}>
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>GapWaterfall — en construcción</span>
        </div>
      ),
    })
  ),
  { ssr: false },
);

const PerformanceMatrix = dynamic(
  () => import('@/components/charts/PerformanceMatrix').catch(() =>
    Promise.resolve({
      default: () => (
        <div style={{
          width: '100%', height: 200,
          background: 'var(--color-off-white)',
          borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px dashed var(--color-cool-gray)',
        }}>
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>PerformanceMatrix — en construcción</span>
        </div>
      ),
    })
  ),
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

// Paper-aligned: SOLO GA vs ILP (Tabla III del paper final)
const METHODS_DATA: MethodData[] = [
  {
    key: 'ilp',
    name: 'PLE — ILP (B&B)',
    subtitle: 'Branch-and-Bound · intlinprog',
    cost: results.exacto.costo,           // $49,988
    size: String(results.exacto.sel_size), // 22
    time: results.exacto.tiempo_s,         // 600.96 s
    gap: 'ref.',
    guarantee: 'IntegerFeasible',
    isWinner: false,
  },
  {
    key: 'ga',
    name: 'Algoritmo Genético',
    subtitle: 'Metaheurística · parada anticipada',
    cost: results.ga_refinado.costo,       // $50,795
    size: String(results.ga_refinado.sel_size), // 23
    time: results.ga_refinado.tiempo_s,    // 7.23 s
    gap: fmtPct(results.ga_refinado.gap_vs_exacto_pct), // 1.61%
    guarantee: '83× más rápido',
    isWinner: true,
  },
];

// ─── Compact method card — prominent CountUp metrics ─────────────────────────
function MethodCard({ data }: { data: MethodData }) {
  if (data.isWinner) {
    return (
      <div
        className="card-cofounder"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 'clamp(20px,3vw,32px) clamp(16px,2.5vw,28px)',
        }}
      >
        <div>
          <p className="t-caption tracking-meta" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            GANADOR PRÁCTICO
          </p>
          <h3
            className="font-serif t-h-sm"
            style={{ color: 'var(--color-canvas-white)', margin: '0 0 2px', fontWeight: 400 }}
          >
            {data.name}
          </h3>
          <p className="t-caption" style={{ color: 'rgba(255,255,255,0.55)', margin: 0 }}>{data.subtitle}</p>
        </div>
        <div className="div-hairline" style={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        <div
          className="font-mono tnum"
          style={{ fontSize: 'clamp(22px,2.8vw,36px)', color: 'var(--color-canvas-white)', fontWeight: 500, lineHeight: 1.1 }}
        >
          <CountUp to={data.cost} prefix="$" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            { k: '|S|', v: data.size },
            { k: 'TIEMPO', v: fmtTime(data.time) },
            { k: 'GAP', v: data.gap },
          ].map(({ k, v }) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="t-caption" style={{ color: 'rgba(255,255,255,0.5)' }}>{k}</span>
              <span className="t-caption font-mono tnum" style={{ color: 'var(--color-canvas-white)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 4 }}>
          {data.key.toUpperCase()}
        </p>
        <h3
          className="font-serif t-h-sm"
          style={{ color: 'var(--color-dark-charcoal)', margin: '0 0 2px', fontWeight: 400 }}
        >
          {data.name}
        </h3>
        <p className="t-caption" style={{ color: 'var(--color-slate-gray)', margin: 0 }}>{data.subtitle}</p>
      </div>
      <div className="div-cool" />
      <div
        className="font-mono tnum"
        style={{ fontSize: 'clamp(18px,2.2vw,28px)', color: 'var(--color-dark-charcoal)', fontWeight: 500, lineHeight: 1.1 }}
      >
        <CountUp to={data.cost} prefix="$" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          { k: 'TIEMPO', v: fmtTime(data.time) },
          { k: 'GAP', v: data.gap },
          { k: 'GARANTÍA', v: data.guarantee },
        ].map(({ k, v }) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>{k}</span>
            <span className="t-caption font-mono tnum" style={{ color: 'var(--color-charcoal)' }}>{v}</span>
          </div>
        ))}
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
              margin: '0 0 clamp(16px,3vh,32px)',
              maxWidth: 900,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          >
            Exacto vs Genético.
          </h2>
        </Reveal>

        {/* 1-line intro */}
        <Reveal delay={0.07}>
          <p className="t-body" style={{ color: 'var(--color-slate-gray)', margin: '0 0 clamp(32px,5vh,64px)', maxWidth: 640 }}>
            El PLE encontró la mejor solución entera en 600 s; el GA llegó a 1.61 % de
            esa solución en 7.23 s — <strong>83 veces más rápido</strong>.
          </p>
        </Reveal>

        {/* GapWaterfall — full-width above cards */}
        <Reveal delay={0.08} variant="scale">
          <div className="card-elevated" style={{ padding: 'clamp(16px,2vw,28px)', marginBottom: 'clamp(24px,4vh,48px)' }}>
            <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 16 }}>
              GAP RELATIVO AL ÓPTIMO ILP
            </p>
            <GapWaterfall />
          </div>
        </Reveal>

        {/* 2-col method cards — PLE (ILP) vs GA */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 'clamp(16px,2vw,32px)',
            marginBottom: 'clamp(32px,5vh,64px)',
          }}
        >
          {METHODS_DATA.map((data) => (
            <Reveal key={data.key} delay={0.06}>
              <MethodCard data={data} />
            </Reveal>
          ))}
        </div>

        <div className="div-cool" style={{ marginBottom: 'clamp(24px,4vh,48px)' }} />

        {/* ComparisonBars full-width */}
        <Reveal delay={0.05}>
          <div>
            <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 16 }}>
              COMPARACIÓN DE COSTOS
            </p>
            <div className="card-elevated" style={{ padding: 'clamp(16px,2vw,28px)', marginBottom: 'clamp(24px,4vh,48px)' }}>
              <ComparisonBars />
            </div>
          </div>
        </Reveal>

        {/* PerformanceMatrix — below comparison bars */}
        <Reveal delay={0.1} variant="scale">
          <div className="card-elevated" style={{ padding: 'clamp(16px,2vw,28px)' }}>
            <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 16 }}>
              MATRIZ DE RENDIMIENTO
            </p>
            <PerformanceMatrix />
          </div>
        </Reveal>
      </div>
    </SceneAnchor>
  );
}
