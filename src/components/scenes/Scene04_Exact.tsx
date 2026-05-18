'use client';

import { useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';
import { results, fmtMoney, fmtTime, fmtPct } from '@/lib/results';

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
    const obs = new IntersectionObserver((e) => { if (e[0]?.isIntersecting) { run(); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    if (el.getBoundingClientRect().top < window.innerHeight * 0.95) run();
    return () => obs.disconnect();
  }, [to, prefix, suffix, decimals]);
  return <span ref={ref} className="tnum font-mono-num">{prefix}{to.toFixed(decimals)}{suffix}</span>;
}

// ─── Branch & Bound tree SVG (progress-driven) ───────────────────────────────

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
    { id: 7, x: 63, y: 40, parent: 2, pruned: true, optional: false } as unknown as BNode,
  ];
}

const TREE_NODES = buildTree();

function BranchBoundTree({ progress }: { progress: number }) {
  const visibleCount = Math.ceil(progress * TREE_NODES.length);
  const visibleNodes = TREE_NODES.slice(0, visibleCount);

  return (
    <svg viewBox="0 0 100 70" width="100%" height="100%" style={{ display: 'block', maxHeight: 480 }} aria-label="Árbol Branch and Bound">
      {/* Edges */}
      {visibleNodes.map((node) => {
        if (node.parent === null) return null;
        const parent = TREE_NODES[node.parent];
        if (!parent) return null;
        return (
          <line key={`e-${node.id}`} x1={parent.x.toFixed(2)} y1={(parent.y + 3.5).toFixed(2)} x2={node.x.toFixed(2)} y2={(node.y - 3.5).toFixed(2)}
            stroke={node.pruned ? 'var(--color-cork-shadow)' : 'var(--color-grey-brown)'} strokeWidth="0.5" strokeDasharray={node.pruned ? '1.5 1' : undefined} opacity={node.pruned ? 0.5 : 0.8} />
        );
      })}
      {/* Nodes */}
      {visibleNodes.map((node) => (
        <g key={node.id}>
          <circle cx={node.x.toFixed(2)} cy={node.y.toFixed(2)} r="3.5"
            fill={node.optimal ? 'var(--color-burnt-sienna)' : node.pruned ? 'var(--color-cork-shadow)' : 'var(--color-dark-cork)'}
            stroke={node.optimal ? 'var(--color-burnt-sienna)' : node.pruned ? 'var(--color-grey-brown)' : 'var(--color-warm-cream)'}
            strokeWidth="0.6" opacity={node.pruned ? 0.45 : 1}
          />
          {node.pruned && (
            <g>
              <line x1={(node.x - 2).toFixed(2)} y1={(node.y - 2).toFixed(2)} x2={(node.x + 2).toFixed(2)} y2={(node.y + 2).toFixed(2)} stroke="var(--color-grey-brown)" strokeWidth="0.6" opacity="0.6" />
              <line x1={(node.x + 2).toFixed(2)} y1={(node.y - 2).toFixed(2)} x2={(node.x - 2).toFixed(2)} y2={(node.y + 2).toFixed(2)} stroke="var(--color-grey-brown)" strokeWidth="0.6" opacity="0.6" />
            </g>
          )}
          {node.optimal && (
            <circle cx={node.x.toFixed(2)} cy={node.y.toFixed(2)} r="6" fill="none" stroke="var(--color-burnt-sienna)" strokeWidth="0.5" opacity="0.4" />
          )}
        </g>
      ))}
      {/* Legend */}
      {progress > 0.8 && (
        <g>
          <circle cx="6" cy="64" r="2.5" fill="var(--color-burnt-sienna)" />
          <text x="10" y="64" fill="var(--color-warm-cream)" fontSize="3.5" dominantBaseline="middle">Óptimo</text>
          <circle cx="30" cy="64" r="2.5" fill="var(--color-cork-shadow)" stroke="var(--color-grey-brown)" strokeWidth="0.5" opacity="0.5" />
          <text x="34" y="64" fill="var(--color-grey-brown)" fontSize="3.5" dominantBaseline="middle" opacity="0.7">Podado</text>
        </g>
      )}
    </svg>
  );
}

// ─── Code snippet type-on ─────────────────────────────────────────────────────

const EXACT_SNIPPET = `% Branch & Bound via CBC solver (MATLAB + Intlinprog)
f     = costos(:);          % vector de costos n×1
Aeq   = [];  beq = [];
lb    = zeros(n,1);  ub = ones(n,1);
intcon = 1:n;               % todas las variables son enteras

opts = optimoptions('intlinprog', ...
    'Display',        'iter', ...
    'MaxTime',        300, ...   % límite 5 min
    'RelObjThreshold', 0);       % gap 0 → óptimo garantizado

[x_opt, fval, flag] = intlinprog(f, intcon, -A, -b, ...
                                  Aeq, beq, lb, ub, opts);
sel = find(x_opt > 0.5);    % antenas seleccionadas`;

function CodeTypeOn({ code, progress }: { code: string; progress: number }) {
  const visibleChars = Math.floor(progress * code.length);
  const visible = code.slice(0, visibleChars);

  return (
    <pre className="hljs" style={{ borderTop: '1px dashed var(--color-cork-shadow)', borderRadius: 0, overflow: 'auto' }}>
      <code style={{ whiteSpace: 'pre' }}>
        {visible}
        {progress < 1 && <span style={{ borderRight: '2px solid var(--color-burnt-sienna)', animation: 'blink 1s step-end infinite' }}>&nbsp;</span>}
        <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </code>
    </pre>
  );
}

// ─── Scene 04 ─────────────────────────────────────────────────────────────────

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

  const resultRows = [
    { label: 'COSTO ÓPTIMO', value: fmtMoney(exacto.costo) },
    { label: 'ANTENAS SELECCIONADAS', value: `|S| = ${exacto.sel_size}` },
    { label: 'TIEMPO DE CÓMPUTO', value: fmtTime(exacto.tiempo_s) },
    { label: 'GAP VS ÓPTIMO', value: '0.00%' },
  ];

  return (
    <SceneAnchor id="exacto" n={4} ariaLabel="Método exacto — Branch and Bound" style={{ background: 'var(--color-studio-black)' }}>
      <div ref={outerRef} style={{ position: 'relative', height: '300vh' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 'var(--gutter)', padding: '0 var(--gutter)', alignItems: 'center', overflow: 'hidden' }}>
          {/* LEFT */}
          <div>
            <div className="div-accent" style={{ marginBottom: 24 }} />
            <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 20 }}>04 · EXACTO · BRANCH &amp; BOUND</p>
            <h2 className="t-display" style={{ color: 'var(--color-warm-cream)', margin: '0 0 28px' }}>
              Óptimo garantizado.<br />Gap cero.
            </h2>
            <p className="t-body-lg" style={{ color: 'var(--color-grey-brown)', margin: '0 0 40px', maxWidth: 400 }}>
              El solver CBC (MATLAB intlinprog) resuelve el ILP exactamente en 5 minutos.
              Branch &amp; Bound particiona el espacio de búsqueda y poda ramas infeasibles
              o dominadas, garantizando el óptimo global.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {resultRows.map(({ label, value }, i) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, padding: '16px 0', borderBottom: '1px dashed var(--color-cork-shadow)', opacity: progress > i * 0.2 ? 1 : 0.2, transition: 'opacity 400ms cubic-bezier(0.32,0.72,0,1)' }}>
                  <span className="t-meta" style={{ color: 'var(--color-grey-brown)' }}>{label}</span>
                  <span className="t-h-sm font-mono-num" style={{ color: 'var(--color-warm-cream)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* RIGHT — tree */}
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }}>
            <BranchBoundTree progress={progress} />
          </div>
        </div>
      </div>

      {/* Code block below */}
      <div style={{ padding: '0 0 var(--section-gap)' }}>
        <div className="container-max">
          <Reveal>
            <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 16, padding: '0 var(--gutter)' }}>IMPLEMENTACIÓN MATLAB</p>
          </Reveal>
          <CodeTypeOn code={EXACT_SNIPPET} progress={Math.min(1, (progress - 0.6) / 0.4)} />
        </div>
      </div>
    </SceneAnchor>
  );
}
