'use client';

import { useRef, useCallback } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';

function ModelILP() {
  return (
    <div style={{ padding: 'clamp(28px,4vw,56px)', border: '1px dashed var(--color-cork-shadow)', background: 'var(--color-deep-cork)', position: 'relative' }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: -1, left: -1, width: 40, height: 40, borderTop: '1px solid var(--color-burnt-sienna)', borderLeft: '1px solid var(--color-burnt-sienna)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: -1, right: -1, width: 40, height: 40, borderBottom: '1px solid var(--color-burnt-sienna)', borderRight: '1px solid var(--color-burnt-sienna)' }} />
      <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 24 }}>FORMULACIÓN ILP</p>
      <div style={{ marginBottom: 20 }}>
        <p className="t-meta" style={{ color: 'var(--color-burnt-sienna)', marginBottom: 8 }}>MINIMIZAR</p>
        <BlockMath math="\sum_{j=1}^{n} c_j \cdot x_j" />
      </div>
      <div className="div-dashed" style={{ marginBottom: 20 }} />
      <div style={{ marginBottom: 20 }}>
        <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 8 }}>SUJETO A</p>
        <BlockMath math="\sum_{j \in S_i} x_j \geq 1 \quad \forall i \in M" />
        <BlockMath math="x_j \in \{0, 1\} \quad \forall j \in N" />
      </div>
      <div className="div-dashed" style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[{ sym: 'M = 500', label: 'clientes' }, { sym: 'N = 500', label: 'antenas' }, { sym: '|A| = 24,971', label: 'cobertura' }].map(({ sym, label }) => (
          <div key={label}>
            <div className="font-mono-num" style={{ fontSize: 13, color: 'var(--color-burnt-sienna)', marginBottom: 4 }}>{sym}</div>
            <div className="t-meta" style={{ color: 'var(--color-grey-brown)' }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MagneticCard({ numeral, title, body }: { numeral: string; title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.06}px,${(e.clientY - r.top - r.height / 2) * 0.06}px)`;
  }, []);
  const onLeave = useCallback(() => { const el = ref.current; if (el) { el.style.transform = 'translate(0,0)'; el.style.transition = 'transform 480ms cubic-bezier(0.32,0.72,0,1)'; } }, []);
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(24px,3vw,56px)', padding: 'clamp(28px,4vh,48px) 0', borderBottom: '1px dashed var(--color-cork-shadow)', cursor: 'default', transition: 'transform 320ms cubic-bezier(0.32,0.72,0,1)' }}>
      <div className="t-display-2xl" style={{ color: 'color-mix(in srgb, var(--color-warm-cream) 8%, transparent)', lineHeight: 0.82, userSelect: 'none', minWidth: '1ch' }}>{numeral}</div>
      <div style={{ paddingTop: 'clamp(8px,1vh,16px)' }}>
        <div className="div-accent" style={{ marginBottom: 16 }} />
        <h3 className="t-h-lg" style={{ color: 'var(--color-warm-cream)', margin: '0 0 12px' }}>{title}</h3>
        <p className="t-body-lg" style={{ color: 'var(--color-grey-brown)', margin: 0, maxWidth: 560 }}>{body}</p>
      </div>
    </div>
  );
}

export function Scene03_Formulation() {
  return (
    <SceneAnchor id="formulacion" n={3} ariaLabel="Formulación matemática del problema de Set Cover" style={{ background: 'var(--color-studio-black)' }}>
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal><p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 32 }}>03 · FORMULACIÓN</p></Reveal>
        <Reveal delay={0.05}>
          <h2 className="t-display-xl" style={{ color: 'var(--color-warm-cream)', margin: '0 0 clamp(48px,7vh,96px)', maxWidth: 900 }}>
            Un modelo.{' '}<span className="shimmer">Tres reglas.</span>
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start', marginBottom: 'var(--section-gap)' }}>
          <Reveal delay={0.1}>
            <p className="t-body-lg" style={{ color: 'var(--color-grey-brown)', margin: '0 0 24px', lineHeight: 1.6 }}>
              El Weighted Set Cover es un problema de Programación Lineal Entera (ILP). Cada antena <span style={{ color: 'var(--color-warm-cream)' }}><InlineMath math="j" /></span> tiene un costo <span style={{ color: 'var(--color-warm-cream)' }}><InlineMath math="c_j" /></span> y cubre un subconjunto de clientes. Se busca la cobertura completa al menor costo posible.
            </p>
          </Reveal>
          <Reveal delay={0.15} variant="scale"><ModelILP /></Reveal>
        </div>
        <div className="div-dashed" style={{ marginBottom: 'clamp(32px,5vh,64px)' }} />
        {[
          { numeral: 'I', title: 'Variables binarias', body: 'xⱼ ∈ {0, 1} para cada antena j ∈ N. Si xⱼ = 1, la antena j se selecciona y su costo se suma. El espacio de búsqueda tiene 2⁵⁰⁰ combinaciones posibles.' },
          { numeral: 'II', title: 'Función objetivo', body: 'Minimizar el costo total Σ cⱼ · xⱼ. Los costos viven en el rango [$2,000 — $3,998]. Seleccionar todas costaría $1,516,821 — la solución óptima lo hace en $50,123.' },
          { numeral: 'III', title: 'Restricciones de cobertura', body: 'Para cada cliente i ∈ M, la suma de antenas que lo cubren debe ser ≥ 1. Las 500 restricciones garantizan cobertura universal. Ningún cliente queda desatendido.' },
        ].map((card) => (
          <Reveal key={card.numeral} delay={0.08}><MagneticCard {...card} /></Reveal>
        ))}
      </div>
    </SceneAnchor>
  );
}
