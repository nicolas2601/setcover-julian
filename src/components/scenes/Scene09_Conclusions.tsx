'use client';

import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { useEffect, useRef } from 'react';

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
        const p = Math.min((now - start) / 1600, 1);
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

// ─── SVG icon annotations — one per takeaway ─────────────────────────────────
function IconBranchBound() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <circle cx="28" cy="10" r="5" stroke="var(--color-cofounder-blue)" strokeWidth="1.5" />
      <circle cx="14" cy="28" r="5" stroke="var(--color-charcoal)" strokeWidth="1.5" />
      <circle cx="42" cy="28" r="5" stroke="var(--color-cool-gray)" strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="8"  cy="44" r="5" fill="var(--color-cofounder-blue)" opacity="0.9" />
      <circle cx="20" cy="44" r="5" stroke="var(--color-cool-gray)" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="28" y1="15" x2="14" y2="23" stroke="var(--color-charcoal)" strokeWidth="1" opacity="0.6" />
      <line x1="28" y1="15" x2="42" y2="23" stroke="var(--color-cool-gray)" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
      <line x1="14" y1="33" x2="8"  y2="39" stroke="var(--color-cofounder-blue)" strokeWidth="1" />
      <line x1="14" y1="33" x2="20" y2="39" stroke="var(--color-cool-gray)" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
    </svg>
  );
}

function IconGA() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      {[12,20,28,36,44].map((x, i) => (
        <circle key={x} cx={x} cy={28 + (i % 2 === 0 ? -6 : 6)} r="3.5"
          fill={i === 2 ? 'var(--color-cofounder-blue)' : 'var(--color-cool-gray)'}
          opacity={i === 2 ? 1 : 0.6}
        />
      ))}
      <path d="M12 22 Q28 10 44 22" stroke="var(--color-cofounder-blue)" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M12 34 Q28 46 44 34" stroke="var(--color-cool-gray)" strokeWidth="1" fill="none" opacity="0.3" strokeDasharray="3 2" />
    </svg>
  );
}

function IconCombinatorial() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="16" height="16" rx="3" stroke="var(--color-charcoal)" strokeWidth="1.5" opacity="0.4" />
      <rect x="20" y="20" width="16" height="16" rx="3" stroke="var(--color-charcoal)" strokeWidth="1.5" opacity="0.6" />
      <rect x="32" y="32" width="16" height="16" rx="3" fill="var(--color-cofounder-blue)" opacity="0.15"
            stroke="var(--color-cofounder-blue)" strokeWidth="1.5" />
      <path d="M16 24 L24 24 L24 32 L32 32" stroke="var(--color-cofounder-blue)" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

const TAKEAWAYS = [
  {
    numeral: 'I',
    title: 'Exactitud tiene un precio — y vale la pena pagarlo cuando el tiempo lo permite.',
    body: 'El solver CBC encuentra el óptimo global en 5 minutos: 22 antenas a $50,123. La relajación LP entrega cota inferior $27,860 — la brecha revela cuánto cuesta ser binario.',
    Icon: IconBranchBound,
  },
  {
    numeral: 'II',
    title: 'La metaheurística no es un truco — es un trade-off honesto.',
    body: 'GA refinado: $50,546 en 44 segundos. Gap 0.84%. Sacrifica menos de 1 punto porcentual de calidad a cambio de 7× menos tiempo.',
    Icon: IconGA,
  },
  {
    numeral: 'III',
    title: '2⁵⁰⁰ combinaciones se doblegan ante la inteligencia combinatoria.',
    body: 'B&B navega con podas inteligentes. GA explora con evolución selectiva. Ambas imponen estructura sobre el caos combinatorio — y ambas funcionan.',
    Icon: IconCombinatorial,
  },
];

// ─── Big metrics row at bottom ────────────────────────────────────────────────
const BOTTOM_METRICS = [
  { label: 'MÁS RÁPIDO QUE EXACTO', value: 7, suffix: '×', decimals: 0 },
  { label: 'GAP FINAL GA', value: 0.844, suffix: '%', decimals: 3 },
  { label: 'ÓPTIMO ILP', value: 50123, prefix: '$', suffix: '', decimals: 0 },
  { label: 'TIEMPO ILP', value: 5, suffix: ' min', decimals: 0 },
];

// ─── Scene 09 — LIGHT ────────────────────────────────────────────────────────
export function Scene09_Conclusions() {
  return (
    <SceneAnchor
      id="conclusiones"
      n={9}
      ariaLabel="Conclusiones — tres lecciones del proyecto"
      style={{ background: 'var(--color-canvas-white)' }}
    >
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal>
          <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 32 }}>
            09 · CONCLUSIONES
          </p>
        </Reveal>

        {/* Centered display headline */}
        <Reveal delay={0.05}>
          <h2
            className="font-serif t-display-xl"
            style={{
              color: 'var(--color-dark-charcoal)',
              margin: '0 0 clamp(40px,7vh,96px)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              textAlign: 'center',
              lineHeight: 0.96,
            }}
          >
            Tres lecciones.
          </h2>
        </Reveal>

        {/* Takeaway sections — 2-sentence max + SVG icon */}
        <div>
          {TAKEAWAYS.map((t, i) => (
            <Reveal key={t.numeral} delay={i * 0.06}>
              <div
                style={{
                  position: 'relative',
                  padding: 'clamp(32px,5vh,64px) 0',
                  borderBottom: '1px solid var(--color-cool-gray)',
                  display: 'grid',
                  gridTemplateColumns: 'auto auto 1fr',
                  gap: 'clamp(24px,4vw,64px)',
                  alignItems: 'start',
                }}
              >
                {/* Ghost serif numeral */}
                <div
                  aria-hidden="true"
                  className="font-serif"
                  style={{
                    fontSize: 'clamp(56px,8vw,88px)',
                    fontWeight: 400,
                    lineHeight: 0.88,
                    color: 'var(--color-cool-gray)',
                    userSelect: 'none',
                    minWidth: '1.2ch',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {t.numeral}
                </div>

                {/* SVG icon next to numeral */}
                <div style={{ paddingTop: 4, opacity: 0.8 }}>
                  <t.Icon />
                </div>

                {/* Content — 2 sentences max */}
                <div>
                  <div className="div-accent" style={{ marginBottom: 16 }} />
                  <h3
                    className="font-serif t-h-lg"
                    style={{
                      color: 'var(--color-dark-charcoal)',
                      margin: '0 0 14px',
                      maxWidth: 680,
                      fontWeight: 400,
                      letterSpacing: '-0.018em',
                    }}
                  >
                    {t.title}
                  </h3>
                  <p
                    className="t-body"
                    style={{ color: 'var(--color-charcoal)', margin: 0, maxWidth: 580, lineHeight: 1.65 }}
                  >
                    {t.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Big metrics row at bottom */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            margin: 'clamp(40px,6vh,80px) 0',
          }}
        >
          {BOTTOM_METRICS.map(({ label, value, prefix = '', suffix, decimals }) => (
            <Reveal key={label}>
              <div className="card-medium" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    fontSize: 'clamp(24px,3vw,40px)',
                    color: 'var(--color-cofounder-blue)',
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                    fontWeight: 500,
                    lineHeight: 1.1,
                  }}
                >
                  <CountUp to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
                </div>
                <div className="div-accent" />
                <p className="t-caption" style={{ color: 'var(--color-medium-gray)', margin: 0, fontWeight: 500 }}>
                  {label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="#" className="btn-solid-dark" aria-label="Descargar código MATLAB">
            DESCARGAR MATLAB
          </a>
          <a href="#" className="btn-outlined-azure" aria-label="Ver documentación Overleaf">
            VER OVERLEAF
          </a>
        </div>
      </div>
    </SceneAnchor>
  );
}
