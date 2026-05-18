'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtPct, fmtMoney, fmtInt } from '@/lib/results';

gsap.registerPlugin(ScrollTrigger);

// ─── CountUp ─────────────────────────────────────────────────────────────────
function CountUp({
  to, prefix = '', suffix = '', decimals = 0, duration = 1.4,
}: {
  to: number; prefix?: string; suffix?: string; decimals?: number; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const run = () => {
      if (triggered.current) return;
      triggered.current = true;
      if (prefersReduced) { el.textContent = prefix + to.toFixed(decimals) + suffix; return; }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / (duration * 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        el.textContent = prefix + (to * ease).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + to.toFixed(decimals) + suffix;
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
  }, [to, prefix, suffix, decimals, duration]);

  return (
    <span ref={ref} className="tnum font-mono">
      {prefix}{to.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── Matrix grid visualization — GIC light theme colors ─────────────────────
const GRID_SIZE = 30;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

function MatrixGridSVGLight({ progress }: { progress: number }) {
  const order = useRef<number[]>([]);
  if (order.current.length === 0) {
    let s = 42 >>> 0;
    const lcg = () => { s = Math.imul(1664525, s) + 1013904223 >>> 0; return s / 0xffffffff; };
    const arr = Array.from({ length: TOTAL_CELLS }, (_: unknown, i: number) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(lcg() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    order.current = arr;
  }

  const filled = Math.round(progress * TOTAL_CELLS * results.eda.densidad_matriz);
  const active = new Set(order.current.slice(0, filled));
  const cellSize = 12;
  const gap = 2;
  const stride = cellSize + gap;
  const svgSize = GRID_SIZE * stride - gap;

  return (
    <svg
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      width="100%"
      height="100%"
      aria-label="Matriz de cobertura 500×500 (representación 30×30)"
      style={{ maxWidth: 420, display: 'block' }}
    >
      {Array.from({ length: TOTAL_CELLS }, (_: unknown, idx: number) => {
        const row = Math.floor(idx / GRID_SIZE);
        const col = idx % GRID_SIZE;
        const isActive = active.has(idx);
        // GIC: active = cofounder-blue, inactive = cool-gray
        return (
          <rect
            key={idx}
            x={(col * stride).toFixed(2)}
            y={(row * stride).toFixed(2)}
            width={cellSize}
            height={cellSize}
            fill={isActive ? 'var(--color-cofounder-blue)' : 'var(--color-cool-gray)'}
            opacity={isActive ? 0.85 : 0.4}
            rx="1"
          />
        );
      })}
    </svg>
  );
}

// ─── Scene 02 — LIGHT ────────────────────────────────────────────────────────
export function Scene02_Problem() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

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

  const { eda } = results;

  const stats = [
    {
      label: 'Densidad',
      value: <CountUp to={parseFloat((eda.densidad_matriz * 100).toFixed(2))} decimals={2} suffix="%" />,
      caption: 'de la matriz A',
    },
    {
      label: 'Entradas iguales a 1',
      value: <CountUp to={eda.total_unos} />,
      caption: 'pares (cliente, antena)',
    },
    {
      label: 'Costo si todas activas',
      value: <CountUp to={eda.costo_total_si_seleccionara_todas} prefix="$" />,
      caption: 'cota superior trivial',
    },
    {
      label: 'Cota LP relajada',
      value: <CountUp to={Math.round(results.exacto.lp_relax_obj)} prefix="$" />,
      caption: 'cota inferior LP',
    },
  ];

  return (
    <SceneAnchor
      id="problema"
      n={2}
      ariaLabel="El problema — Set Cover 500×500"
      style={{ background: 'var(--color-canvas-white)' }}
    >
      <div ref={outerRef} style={{ position: 'relative', height: '200vh' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'grid',
            gridTemplateColumns: '5fr 7fr',
            gap: 'var(--gutter)',
            padding: '0 var(--gutter)',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* LEFT — editorial text */}
          <div>
            <p
              className="t-caption tracking-meta"
              style={{ color: 'var(--color-medium-gray)', marginBottom: 20 }}
            >
              02 · EL PROBLEMA
            </p>
            <h2
              className="font-serif t-h-lg"
              style={{
                color: 'var(--color-dark-charcoal)',
                margin: '0 0 28px',
                fontWeight: 400,
                letterSpacing: '-0.02em',
              }}
            >
              Cada cliente exige cobertura.
            </h2>
            <p
              className="t-body-lg"
              style={{ color: 'var(--color-charcoal)', margin: '0 0 16px', maxWidth: 440, lineHeight: 1.65 }}
            >
              Dada una matriz binaria A de {eda.n_clientes} clientes × {eda.n_antenas} antenas,
              seleccionar el subconjunto de antenas de costo mínimo tal que cada fila
              tenga al menos un uno activo.
            </p>
            <p
              className="t-body"
              style={{ color: 'var(--color-slate-gray)', margin: '0 0 32px', maxWidth: 420, lineHeight: 1.6 }}
            >
              Con {eda.n_antenas} variables binarias, el espacio de búsqueda es 2
              <sup style={{ fontSize: '0.7em' }}>{eda.n_antenas}</sup> —
              un número mayor que átomos en el universo observable.
            </p>
            {/* Progress scroll indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 140,
                  height: 2,
                  background: 'var(--color-cool-gray)',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.round(progress * 100)}%`,
                    background: 'var(--color-cofounder-blue)',
                    transition: 'width 80ms linear',
                    borderRadius: 1,
                  }}
                />
              </div>
              <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>
                {Math.round(progress * TOTAL_CELLS * eda.densidad_matriz)} activas
              </span>
            </div>
          </div>

          {/* RIGHT — matrix card */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div className="card-elevated" style={{ width: '100%', maxWidth: 460 }}>
              <p
                className="t-caption tracking-meta"
                style={{ color: 'var(--color-medium-gray)', marginBottom: 16, textAlign: 'right' }}
              >
                A ∈ &#123;0,1&#125;
                <sup style={{ fontSize: '0.7em' }}>500×500</sup>
                {' '}· DENSIDAD {fmtPct(eda.densidad_matriz * 100)}
              </p>
              <MatrixGridSVGLight progress={progress} />
              <div className="div-cool" style={{ marginTop: 16 }} />
              <p
                className="t-caption"
                style={{ color: 'var(--color-medium-gray)', marginTop: 8, textAlign: 'right' }}
              >
                REPRESENTACIÓN 30×30 · {Math.round(progress * TOTAL_CELLS * eda.densidad_matriz)} ACTIVAS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row — 4 card-medium */}
      <div
        style={{
          padding: 'var(--section-gap) var(--gutter)',
          background: 'var(--color-off-white)',
          borderTop: '1px solid var(--color-cool-gray)',
        }}
      >
        <div className="container-max">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {stats.map(({ label, value, caption }) => (
              <Reveal key={label}>
                <div className="card-medium" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div
                    className="t-display font-mono tnum"
                    style={{ color: 'var(--color-dark-charcoal)', lineHeight: 1.1 }}
                  >
                    {value}
                  </div>
                  <div className="div-accent" />
                  <p className="t-caption" style={{ color: 'var(--color-charcoal)', margin: 0, fontWeight: 500 }}>
                    {label}
                  </p>
                  <p className="t-caption" style={{ color: 'var(--color-medium-gray)', margin: 0 }}>
                    {caption}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </SceneAnchor>
  );
}
