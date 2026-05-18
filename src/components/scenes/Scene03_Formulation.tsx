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

// ─── Numbered rule row — serif numeral ───────────────────────────────────────
function RuleRow({ numeral, title, body }: { numeral: string; title: string; body: string }) {
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
        gap: 'clamp(24px,3vw,56px)',
        padding: 'clamp(32px,4vh,56px) 0',
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
          fontSize: 'clamp(64px, 8vw, 96px)',
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
      {/* Content */}
      <div style={{ paddingTop: 'clamp(8px,1vh,16px)' }}>
        <div className="div-accent" style={{ marginBottom: 16 }} />
        <h3
          className="font-serif t-h-sm"
          style={{ color: 'var(--color-dark-charcoal)', margin: '0 0 12px', fontWeight: 400 }}
        >
          {title}
        </h3>
        <p className="t-body-lg" style={{ color: 'var(--color-charcoal)', margin: 0, maxWidth: 560, lineHeight: 1.65 }}>
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
              margin: '0 0 clamp(48px,7vh,96px)',
              maxWidth: 900,
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          >
            Un modelo. Tres reglas.
          </h2>
        </Reveal>

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
            <p className="t-body-lg" style={{ color: 'var(--color-charcoal)', margin: '0 0 24px', lineHeight: 1.7 }}>
              El Weighted Set Cover es un problema de Programación Lineal Entera (ILP).
              Cada antena <InlineMath math="j" /> tiene un costo <InlineMath math="c_j" /> y
              cubre un subconjunto de clientes. Se busca la cobertura completa al menor costo posible.
            </p>
          </Reveal>
          <Reveal delay={0.15} variant="scale">
            <ModelILP />
          </Reveal>
        </div>

        <div className="div-cool" style={{ marginBottom: 'clamp(32px,5vh,64px)' }} />

        {[
          {
            numeral: 'I',
            title: 'Variables binarias',
            body: 'xⱼ ∈ {0, 1} para cada antena j ∈ N. Si xⱼ = 1, la antena j se selecciona y su costo se suma. El espacio de búsqueda tiene 2⁵⁰⁰ combinaciones posibles.',
          },
          {
            numeral: 'II',
            title: 'Función objetivo',
            body: 'Minimizar el costo total Σ cⱼ · xⱼ. Los costos viven en el rango [$2,000 — $3,998]. Seleccionar todas costaría $1,516,821 — la solución óptima lo hace en $50,123.',
          },
          {
            numeral: 'III',
            title: 'Restricciones de cobertura',
            body: 'Para cada cliente i ∈ M, la suma de antenas que lo cubren debe ser ≥ 1. Las 500 restricciones garantizan cobertura universal. Ningún cliente queda desatendido.',
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
