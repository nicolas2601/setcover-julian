'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtPct } from '@/lib/results';

gsap.registerPlugin(ScrollTrigger);

// ─── CountUp ─────────────────────────────────────────────────────────────────

function CountUp({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.4,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
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
      if (prefersReduced) {
        el.textContent = prefix + to.toFixed(decimals) + suffix;
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / (duration * 1000), 1);
        const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
        const val = to * ease;
        el.textContent = prefix + val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + to.toFixed(decimals) + suffix;
      };
      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) { run(); observer.disconnect(); }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95) run();
    return () => observer.disconnect();
  }, [to, prefix, suffix, decimals, duration]);

  return (
    <span ref={ref} className="tnum font-mono-num">
      {prefix}{to.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── Matrix grid visualization ────────────────────────────────────────────────

const GRID_SIZE = 30;
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE;

function MatrixGridSVG({ progress }: { progress: number }) {
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
        const isHighlight = isActive && idx % 11 === 0;
        return (
          <rect
            key={idx}
            x={(col * stride).toFixed(2)}
            y={(row * stride).toFixed(2)}
            width={cellSize}
            height={cellSize}
            fill={
              isHighlight
                ? 'var(--color-burnt-sienna)'
                : isActive
                ? 'color-mix(in srgb, var(--color-warm-cream) 55%, transparent)'
                : 'var(--color-cork-shadow)'
            }
            opacity={isActive ? 1 : 0.25}
            rx="1"
          />
        );
      })}
    </svg>
  );
}

// ─── Scene 02 ─────────────────────────────────────────────────────────────────

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

  return (
    <SceneAnchor
      id="problema"
      n={2}
      ariaLabel="El problema — Set Cover 500×500"
      style={{ background: 'var(--color-studio-black)' }}
    >
      <div ref={outerRef} style={{ position: 'relative', height: '200vh' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--gutter)',
            padding: '0 var(--gutter)',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          {/* LEFT */}
          <div>
            <div className="div-accent" style={{ marginBottom: 24 }} />
            <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 20 }}>
              02 · EL PROBLEMA
            </p>
            <h2
              className="t-display"
              style={{ color: 'var(--color-warm-cream)', margin: '0 0 28px' }}
            >
              Cada cliente exige cobertura.
            </h2>
            <p className="t-body-lg" style={{ color: 'var(--color-grey-brown)', margin: '0 0 16px', maxWidth: 440 }}>
              Dada una matriz binaria A de {eda.n_clientes} clientes × {eda.n_antenas} antenas,
              seleccionar el subconjunto de antenas de costo mínimo tal que cada fila
              tenga al menos un uno activo.
            </p>
            <p className="t-body" style={{ color: 'var(--color-grey-brown)', margin: 0, maxWidth: 420, opacity: 0.75 }}>
              Con {eda.n_antenas} variables binarias, el espacio de búsqueda es 2
              <sup style={{ fontSize: '0.7em' }}>{eda.n_antenas}</sup> —
              un número mayor que átomos en el universo observable.
            </p>
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 160, height: 2, background: 'var(--color-cork-shadow)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: 'var(--color-burnt-sienna)', transition: 'width 80ms linear' }} />
              </div>
              <span className="t-meta" style={{ color: 'var(--color-grey-brown)' }}>
                {(progress * 100).toFixed(0)}% SCROLL
              </span>
            </div>
          </div>

          {/* RIGHT — matrix */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: '100%', maxWidth: 440 }}>
              <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 16, textAlign: 'right' }}>
                A ∈ &#123;0,1&#125;
                <sup style={{ fontSize: '0.7em' }}>500×500</sup>
                {' '}· DENSIDAD {fmtPct(eda.densidad_matriz * 100)}
              </p>
              <MatrixGridSVG progress={progress} />
              <div className="div-dashed" style={{ marginTop: 16 }} />
              <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginTop: 8, textAlign: 'right' }}>
                REPRESENTACIÓN 30×30 · {Math.round(progress * TOTAL_CELLS * eda.densidad_matriz)} ACTIVAS
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: 'var(--section-gap) var(--gutter)', borderTop: '1px dashed var(--color-cork-shadow)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--color-cork-shadow)' }}>
          {([
            { label: 'DENSIDAD', value: <CountUp to={parseFloat((eda.densidad_matriz * 100).toFixed(2))} decimals={2} suffix="%" /> },
            { label: 'MATRIZ', value: <span className="tnum font-mono-num">500×500</span> },
            { label: 'COSTO MÁXIMO', value: <CountUp to={eda.costo_total_si_seleccionara_todas} prefix="$" /> },
            { label: 'COTA LP', value: <CountUp to={Math.round(results.exacto.lp_relax_obj)} prefix="$" /> },
          ] as Array<{ label: string; value: React.ReactNode }>).map(({ label, value }) => (
            <Reveal key={label} variant="fadeUp">
              <div
                data-cursor="VER DETALLE"
                style={{
                  background: 'var(--color-studio-black)',
                  padding: 'clamp(28px, 4vh, 56px) clamp(20px, 3vw, 40px)',
                  cursor: 'default',
                  transition: 'background 280ms cubic-bezier(0.32,0.72,0,1)',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-deep-cork)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-studio-black)'; }}
              >
                <div className="t-display" style={{ color: 'var(--color-warm-cream)', marginBottom: 12 }}>
                  {value}
                </div>
                <div className="div-accent" style={{ marginBottom: 12 }} />
                <p className="t-meta" style={{ color: 'var(--color-grey-brown)', margin: 0 }}>{label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SceneAnchor>
  );
}
