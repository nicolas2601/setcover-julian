'use client';

import { useRef, useCallback } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';

// ─── ILP model card — light theme ────────────────────────────────────────────
function ModelILP() {
  return (
    <div
      className="card-elevated"
      style={{ position: 'relative', padding: 'clamp(28px,4vw,48px)' }}
    >
      {/* Accent corner decorators */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: -1, left: -1,
          width: 32, height: 32,
          borderTop: '2px solid var(--color-cofounder-blue)',
          borderLeft: '2px solid var(--color-cofounder-blue)',
          borderRadius: '12px 0 0 0',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: -1, right: -1,
          width: 32, height: 32,
          borderBottom: '2px solid var(--color-cofounder-blue)',
          borderRight: '2px solid var(--color-cofounder-blue)',
          borderRadius: '0 0 12px 0',
        }}
      />

      <p
        className="t-caption tracking-meta"
        style={{ color: 'var(--color-cofounder-blue)', marginBottom: 20 }}
      >
        FORMULACIÓN ILP
      </p>

      <div style={{ marginBottom: 20 }}>
        <p className="t-caption" style={{ color: 'var(--color-medium-gray)', marginBottom: 8, fontWeight: 500 }}>
          MINIMIZAR
        </p>
        <BlockMath math="\sum_{j=1}^{n} c_j \cdot x_j" />
      </div>

      <div className="div-cool" style={{ marginBottom: 20 }} />

      <div style={{ marginBottom: 20 }}>
        <p className="t-caption" style={{ color: 'var(--color-medium-gray)', marginBottom: 8, fontWeight: 500 }}>
          SUJETO A
        </p>
        <BlockMath math="\sum_{j \in S_i} x_j \geq 1 \quad \forall i \in M" />
        <BlockMath math="x_j \in \{0, 1\} \quad \forall j \in N" />
      </div>

      <div className="div-cool" style={{ marginBottom: 20 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { sym: 'M = 500', label: 'clientes' },
          { sym: 'N = 500', label: 'antenas' },
          { sym: '|A| = 24,971', label: 'cobertura' },
        ].map(({ sym, label }) => (
          <div key={label}>
            <div
              className="font-mono tnum"
              style={{ fontSize: 13, color: 'var(--color-cofounder-blue)', marginBottom: 4, fontWeight: 500 }}
            >
              {sym}
            </div>
            <div className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Compact rule row — math expression + 1-sentence purpose ─────────────────
function RuleRow({ numeral, title, math, body }: { numeral: string; title: string; math: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.03}px,${(e.clientY - r.top - r.height / 2) * 0.03}px)`;
  }, []);
  const onLeave = useCallback(() => {
    const el = ref.current;
    if (el) { el.style.transform = 'translate(0,0)'; el.style.transition = 'transform 480ms cubic-bezier(0.32,0.72,0,1)'; }
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 'clamp(20px,3vw,48px)',
        padding: 'clamp(24px,3vh,40px) 0',
        borderBottom: '1px solid var(--color-cool-gray)',
        cursor: 'default',
        transition: 'transform 320ms cubic-bezier(0.32,0.72,0,1)',
        alignItems: 'start',
      }}
    >
      {/* Large ghost serif numeral */}
      <div
        aria-hidden="true"
        className="font-serif"
        style={{
          fontSize: 'clamp(56px,7vw,80px)',
          fontWeight: 400,
          lineHeight: 0.88,
          color: 'var(--color-cool-gray)',
          userSelect: 'none',
          minWidth: '1.2ch',
          letterSpacing: '-0.02em',
        }}
      >
        {numeral}
      </div>
      {/* Content — math expression + 1-sentence body */}
      <div style={{ paddingTop: 'clamp(6px,1vh,12px)' }}>
        <div className="div-accent" style={{ marginBottom: 12 }} />
        <h3
          className="font-serif t-h-sm"
          style={{ color: 'var(--color-dark-charcoal)', margin: '0 0 8px', fontWeight: 400 }}
        >
          {title}
        </h3>
        {/* Math expression — compact */}
        <div style={{ marginBottom: 8, fontSize: '0.9em' }}>
          <InlineMath math={math} />
        </div>
        <p className="t-body" style={{ color: 'var(--color-slate-gray)', margin: 0, maxWidth: 500, lineHeight: 1.55 }}>
          {body}
        </p>
      </div>
    </div>
  );
}

// ─── Scene 03 — LIGHT ────────────────────────────────────────────────────────
export function Scene03_Formulation() {
  return (
    <SceneAnchor
      id="formulacion"
      n={3}
      ariaLabel="Formulación matemática del problema de Set Cover"
      style={{ background: 'var(--color-off-white)' }}
    >
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal>
          <p className="t-caption tracking-meta" style={{ color: 'var(--color-medium-gray)', marginBottom: 32 }}>
            03 · FORMULACIÓN
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            className="font-serif t-display-xl"
            style={{
              color: 'var(--color-dark-charcoal)',
              margin: '0 0 clamp(40px,6vh,80px)',
              maxWidth: 900,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          >
            Un modelo. Tres reglas.
          </h2>
        </Reveal>

        {/* 1-line intro + ILP card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '5fr 7fr',
            gap: 'clamp(32px,5vw,80px)',
            alignItems: 'start',
            marginBottom: 'var(--section-gap)',
          }}
        >
          <Reveal delay={0.1}>
            {/* Cut to 1 line — was a full paragraph */}
            <p className="t-body-lg" style={{ color: 'var(--color-charcoal)', margin: 0, lineHeight: 1.65 }}>
              ILP binario con restricciones de cobertura.
            </p>
          </Reveal>
          <Reveal delay={0.15} variant="scale">
            <ModelILP />
          </Reveal>
        </div>

        <div className="div-cool" style={{ marginBottom: 'clamp(24px,4vh,48px)' }} />

        {/* 3 compact rule rows — math expression + 1-sentence body */}
        {[
          {
            numeral: 'I',
            title: 'Variables binarias',
            math: 'x_j \\in \\{0, 1\\},\\; j \\in N',
            body: 'Si xⱼ = 1, la antena j se activa. El espacio de búsqueda tiene 2⁵⁰⁰ combinaciones.',
          },
          {
            numeral: 'II',
            title: 'Función objetivo',
            math: '\\min\\sum_{j} c_j x_j,\\; c_j \\in [\\$2{,}000,\\,\\$3{,}998]',
            body: 'Minimizar el costo total. La solución óptima lo hace en $50,123 vs $1,516,821 si se seleccionaran todas.',
          },
          {
            numeral: 'III',
            title: 'Restricciones de cobertura',
            math: '\\sum_{j \\in S_i} x_j \\geq 1,\\; \\forall i \\in M',
            body: '500 restricciones garantizan cobertura universal. Ningún cliente queda desatendido.',
          },
        ].map((rule) => (
          <Reveal key={rule.numeral} delay={0.08}>
            <RuleRow {...rule} />
          </Reveal>
        ))}
      </div>
    </SceneAnchor>
  );
}
