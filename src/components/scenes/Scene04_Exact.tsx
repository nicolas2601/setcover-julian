'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtTime } from '@/lib/results';

gsap.registerPlugin(ScrollTrigger);

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

// ─── Branch & Bound tree — GIC light theme ───────────────────────────────────
interface BNode { id: number; x: number; y: number; parent: number | null; pruned: boolean; optimal: boolean }

function buildTree(): BNode[] {
  return [
    { id: 0, x: 50, y: 8, parent: null, pruned: false, optimal: false },
    { id: 1, x: 25, y: 24, parent: 0, pruned: false, optimal: false },
    { id: 2, x: 75, y: 24, parent: 0, pruned: true, optimal: false },
    { id: 3, x: 12, y: 40, parent: 1, pruned: false, optimal: false },
    { id: 4, x: 38, y: 40, parent: 1, pruned: true, optimal: false },
    { id: 5, x: 6, y: 56, parent: 3, pruned: false, optimal: true },
    { id: 6, x: 18, y: 56, parent: 3, pruned: true, optimal: false },
    { id: 7, x: 63, y: 40, parent: 2, pruned: true, optimal: false },
  ];
}

const TREE_NODES = buildTree();

// Step labels shown as sticky badge
const STEP_LABELS = [
  'INICIO — nodo raíz LP',
  'Bifurcando x₁₄ = 0',
  'Bifurcando x₁₄ = 1',
  'Bifurcando x₂₀',
  'PODADO — cota superada',
  'ÓPTIMO — $50,123',
  'PODADO — infactible',
  'PODADO — dominado',
];

function BranchBoundTreeLight({ progress }: { progress: number }) {
  const visibleCount = Math.ceil(progress * TREE_NODES.length);
  const visibleNodes = TREE_NODES.slice(0, visibleCount);
  const currentStep = Math.min(visibleCount - 1, STEP_LABELS.length - 1);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox="0 0 100 70"
        width="100%"
        height="100%"
        style={{ display: 'block', maxHeight: 480 }}
        aria-label="Árbol Branch and Bound — tema claro"
      >
        {/* Edges */}
        {visibleNodes.map((node) => {
          if (node.parent === null) return null;
          const parent = TREE_NODES[node.parent];
          if (!parent) return null;
          return (
            <line
              key={`e-${node.id}`}
              x1={parent.x.toFixed(2)}
              y1={(parent.y + 3.5).toFixed(2)}
              x2={node.x.toFixed(2)}
              y2={(node.y - 3.5).toFixed(2)}
              stroke={node.pruned ? 'var(--color-steel-gray)' : 'var(--color-dark-charcoal)'}
              strokeWidth="0.5"
              strokeDasharray={node.pruned ? '1.5 1' : undefined}
              opacity={node.pruned ? 0.4 : 0.7}
            />
          );
        })}
        {/* Nodes */}
        {visibleNodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x.toFixed(2)}
              cy={node.y.toFixed(2)}
              r="3.5"
              fill={
                node.optimal
                  ? 'var(--color-cofounder-blue)'
                  : node.pruned
                  ? 'var(--color-ash-gray)'
                  : 'var(--color-dark-charcoal)'
              }
              stroke={
                node.optimal
                  ? 'var(--color-cofounder-blue)'
                  : node.pruned
                  ? 'var(--color-steel-gray)'
                  : 'var(--color-charcoal)'
              }
              strokeWidth="0.6"
              opacity={node.pruned ? 0.45 : 1}
            />
            {node.pruned && (
              <g>
                <line
                  x1={(node.x - 2).toFixed(2)} y1={(node.y - 2).toFixed(2)}
                  x2={(node.x + 2).toFixed(2)} y2={(node.y + 2).toFixed(2)}
                  stroke="var(--color-light-gray)" strokeWidth="0.6" opacity="0.8"
                />
                <line
                  x1={(node.x + 2).toFixed(2)} y1={(node.y - 2).toFixed(2)}
                  x2={(node.x - 2).toFixed(2)} y2={(node.y + 2).toFixed(2)}
                  stroke="var(--color-light-gray)" strokeWidth="0.6" opacity="0.8"
                />
              </g>
            )}
            {node.optimal && (
              <circle
                cx={node.x.toFixed(2)}
                cy={node.y.toFixed(2)}
                r="6"
                fill="none"
                stroke="var(--color-cofounder-blue)"
                strokeWidth="0.5"
                opacity="0.5"
              />
            )}
          </g>
        ))}
        {/* Legend */}
        {progress > 0.8 && (
          <g>
            <circle cx="6" cy="64" r="2.5" fill="var(--color-cofounder-blue)" />
            <text x="10" y="64" fill="var(--color-dark-charcoal)" fontSize="3.5" dominantBaseline="middle">Óptimo</text>
            <circle cx="30" cy="64" r="2.5" fill="var(--color-ash-gray)" stroke="var(--color-steel-gray)" strokeWidth="0.5" />
            <text x="34" y="64" fill="var(--color-slate-gray)" fontSize="3.5" dominantBaseline="middle">Podado</text>
          </g>
        )}
      </svg>

      {/* Step counter sticky badge — RIGHT side overlay */}
      {currentStep >= 0 && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 0,
            background: 'var(--color-off-white)',
            border: '1px solid var(--color-cool-gray)',
            borderRadius: 8,
            padding: '8px 14px',
            maxWidth: 200,
            transition: 'opacity 300ms',
          }}
        >
          <div className="t-caption" style={{ color: 'var(--color-medium-gray)', marginBottom: 3, letterSpacing: '0.08em' }}>
            PASO {currentStep + 1} / {TREE_NODES.length}
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--color-dark-charcoal)', lineHeight: 1.4 }}>
            {STEP_LABELS[currentStep]}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Focused code snippet — only 8 key lines ─────────────────────────────────
const EXACT_SNIPPET_SHORT = `opts = optimoptions('intlinprog', ...
    'Display',        'iter', ...
    'MaxTime',        300, ...
    'RelObjThreshold', 0);

[x_opt, fval, flag] = intlinprog(f, intcon, -A, -b, ...
                                  [], [], lb, ub, opts);
sel = find(x_opt > 0.5);`;

function CodeTypeOn({ code, progress }: { code: string; progress: number }) {
  const visibleChars = Math.floor(progress * code.length);
  const visible = code.slice(0, visibleChars);
  return (
    <pre className="hljs" style={{ borderRadius: 12, overflow: 'auto' }}>
      <code style={{ whiteSpace: 'pre' }}>
        {visible}
        {progress < 1 && (
          <span style={{ borderRight: '2px solid var(--color-cofounder-blue)', animation: 'blink 1s step-end infinite' }}>
            &nbsp;
          </span>
        )}
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </code>
    </pre>
  );
}

// ─── Scene 04 — LIGHT ────────────────────────────────────────────────────────
export function Scene04_Exact() {
  const outerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const { exacto } = results;

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

  // 4 stat cards with BIG CountUp display — replaces body paragraph
  const statCards = [
    { label: 'COSTO ÓPTIMO', value: exacto.costo, prefix: '$', suffix: '', decimals: 0 },
    { label: 'ANTENAS SELECCIONADAS', value: exacto.sel_size, prefix: '|S| = ', suffix: '', decimals: 0 },
    { label: 'TIEMPO DE CÓMPUTO', value: exacto.tiempo_s / 60, prefix: '', suffix: ' min', decimals: 1 },
    { label: 'GAP VS ÓPTIMO', value: 0, prefix: '', suffix: '.00%', decimals: 0 },
  ];

  return (
    <SceneAnchor
      id="exacto"
      n={4}
      ariaLabel="Método exacto — Branch and Bound"
      style={{ background: 'var(--color-canvas-white)' }}
    >
      <div ref={outerRef} style={{ position: 'relative', height: '300vh' }}>
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
          {/* LEFT — headline + 4 big stat cards (no body paragraph) */}
          <div>
            <p
              className="t-caption tracking-meta"
              style={{ color: 'var(--color-medium-gray)', marginBottom: 20 }}
            >
              04 · EXACTO · BRANCH &amp; BOUND
            </p>
            <h2
              className="font-serif t-display"
              style={{
                color: 'var(--color-dark-charcoal)',
                margin: '0 0 32px',
                fontWeight: 400,
                letterSpacing: '-0.022em',
              }}
            >
              El precio del óptimo.
            </h2>

            {/* BIG stat cards — replaced body paragraph */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {statCards.map(({ label, value, prefix, suffix, decimals }, i) => (
                <div
                  key={label}
                  className="card-medium"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    opacity: progress > i * 0.18 ? 1 : 0.2,
                    transition: 'opacity 400ms cubic-bezier(0.32,0.72,0,1)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'clamp(22px,2.8vw,36px)',
                      color: 'var(--color-dark-charcoal)',
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 500,
                      lineHeight: 1.1,
                    }}
                  >
                    {label === 'GAP VS ÓPTIMO'
                      ? <span className="tnum font-mono">0.00%</span>
                      : <CountUp to={value} prefix={prefix} suffix={suffix} decimals={decimals} />
                    }
                  </div>
                  <div className="div-accent" />
                  <p className="t-caption" style={{ color: 'var(--color-medium-gray)', margin: 0, fontWeight: 500 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — B&B tree 60% width with step counter badge */}
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 0',
            }}
          >
            <BranchBoundTreeLight progress={progress} />
          </div>
        </div>
      </div>

      {/* Code block below pin — 8 focal lines */}
      <div
        style={{
          background: 'var(--color-off-white)',
          borderTop: '1px solid var(--color-cool-gray)',
          padding: 'var(--section-gap) 0',
        }}
      >
        <div className="container-max" style={{ padding: '0 var(--gutter)' }}>
          <Reveal>
            <p
              className="t-caption tracking-meta"
              style={{ color: 'var(--color-medium-gray)', marginBottom: 16 }}
            >
              IMPLEMENTACIÓN MATLAB — LÍNEAS CLAVE
            </p>
          </Reveal>
          <CodeTypeOn code={EXACT_SNIPPET_SHORT} progress={Math.min(1, (progress - 0.6) / 0.4)} />
        </div>
      </div>
    </SceneAnchor>
  );
}
