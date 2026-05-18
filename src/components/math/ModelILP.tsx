'use client';

import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

// ---- GSAP dynamic import (client-only) ------------------------------------

async function getGSAP() {
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  gsap.registerPlugin(ScrollTrigger);
  return { gsap, ScrollTrigger };
}

// ---- data ------------------------------------------------------------------

const ILP_ROWS = [
  {
    math: String.raw`\min \displaystyle\sum_{j=1}^{N} c_j \cdot x_j`,
    label: 'FUNCIÓN OBJETIVO',
    annotation: 'Minimiza el costo total de las antenas seleccionadas.',
  },
  {
    math: String.raw`\text{s.t.} \displaystyle\sum_{j=1}^{N} a_{ij} \cdot x_j \geq 1 \quad \forall\, i = 1,\ldots, M`,
    label: 'RESTRICCIÓN DE COBERTURA',
    annotation: 'Todo cliente i debe quedar cubierto por al menos una antena.',
  },
  {
    math: String.raw`x_j \in \{0, 1\} \quad \forall\, j = 1, \ldots, N`,
    label: 'INTEGRALIDAD',
    annotation: 'Cada antena se selecciona o no — variable binaria.',
  },
] as const;

// ---- component -------------------------------------------------------------

export function ModelILP() {
  const hairlineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let cleanups: (() => void)[] = [];

    // Respect reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    getGSAP().then(({ gsap, ScrollTrigger }) => {
      hairlineRefs.current.forEach((el, i) => {
        if (!el) return;

        // Draw in the burnt-sienna hairline from left
        gsap.set(el, { scaleX: 0, transformOrigin: 'left center' });

        const st = ScrollTrigger.create({
          trigger: rowRefs.current[i] ?? el,
          start: 'top 85%',
          onEnter: () => {
            gsap.to(el, {
              scaleX: 1,
              duration: 0.8,
              delay: i * 0.15,
              ease: 'power2.out',
            });
          },
          once: true,
        });

        cleanups.push(() => st.kill());
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
      role="region"
      aria-label="Formulación ILP del Set Cover"
    >
      {ILP_ROWS.map((row, i) => (
        <div
          key={i}
          ref={(el) => { rowRefs.current[i] = el; }}
          style={{
            borderTop: i === 0 ? '1px dashed var(--color-cork-shadow)' : undefined,
            borderBottom: '1px dashed var(--color-cork-shadow)',
            padding: '32px 0 24px',
            position: 'relative',
          }}
        >
          {/* Animated burnt-sienna hairline */}
          <div
            ref={(el) => { hairlineRefs.current[i] = el; }}
            className="div-accent"
            style={{
              position: 'absolute',
              top: -1,
              left: 0,
              width: 80,
              transformOrigin: 'left center',
              // Initial scaleX set by GSAP; fallback visible if GSAP fails
            }}
            aria-hidden="true"
          />

          {/* KaTeX block */}
          <div
            style={{
              fontSize: 'clamp(16px, 2.2vw, 22px)',
              overflowX: 'auto',
              paddingBottom: 8,
            }}
          >
            <BlockMath math={row.math} errorColor="var(--color-burnt-sienna)" />
          </div>

          {/* 3-column annotation row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 2fr 1fr',
              gap: '12px 24px',
              alignItems: 'start',
              marginTop: 12,
            }}
          >
            {/* Col 1: meta label */}
            <div>
              <div className="div-accent" style={{ marginBottom: 8 }} aria-hidden="true" />
              <span
                className="t-meta"
                style={{ color: 'var(--color-grey-brown)' }}
              >
                {row.label}
              </span>
            </div>

            {/* Col 2: annotation */}
            <p
              className="t-body"
              style={{
                color: 'var(--color-warm-cream)',
                opacity: 0.75,
                margin: 0,
              }}
            >
              {row.annotation}
            </p>

            {/* Col 3: row index */}
            <div
              style={{
                textAlign: 'right',
                fontFamily: 'var(--t-mono)',
                fontSize: 11,
                color: 'var(--color-grey-brown)',
                opacity: 0.5,
                letterSpacing: '0.08em',
              }}
            >
              ({i + 1}/{ILP_ROWS.length})
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
