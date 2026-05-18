'use client';

import SceneAnchor from '@/components/chrome/SceneAnchor';
import { Reveal } from '@/components/motion/Reveal';

const TAKEAWAYS = [
  {
    numeral: 'I',
    title: 'Exactitud tiene un precio — y vale la pena pagarlo cuando el tiempo lo permite.',
    body: 'El solver CBC (Branch & Bound) encuentra el óptimo global en 5 minutos. Con 22 antenas a $50,123, provee la referencia de la que ningún heurístico puede escapar. La relajación LP entrega una cota inferior $27,860 — la brecha hasta el óptimo entero revela cuánto "cuesta" ser binario vs. continuo.',
  },
  {
    numeral: 'II',
    title: 'La metaheurística no es un truco — es un trade-off honesto.',
    body: 'El GA refinado llega a $50,546 en 44 segundos. Gap de 0.84% respecto al óptimo. Sacrifica 0.8 puntos porcentuales de calidad a cambio de 6× menos tiempo. Para instancias donde 5 minutos no son viables, esto es una herramienta de primera clase.',
  },
  {
    numeral: 'III',
    title: '2⁵⁰⁰ combinaciones se doblegan ante la inteligencia combinatoria.',
    body: 'El espacio de búsqueda es astronómico. La enumeración directa es imposible. Branch & Bound lo navega con podas inteligentes. El GA lo explora con evolución selectiva. Ambas son formas de imponer estructura sobre el caos combinatorio — y ambas funcionan.',
  },
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
              margin: '0 0 clamp(48px,8vh,112px)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              textAlign: 'center',
              lineHeight: 0.96,
            }}
          >
            Tres lecciones.
          </h2>
        </Reveal>

        {/* Takeaway sections */}
        <div>
          {TAKEAWAYS.map((t, i) => (
            <Reveal key={t.numeral} delay={i * 0.06}>
              <div
                style={{
                  position: 'relative',
                  padding: 'clamp(40px,6vh,80px) 0',
                  borderBottom: '1px solid var(--color-cool-gray)',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 'clamp(32px,5vw,80px)',
                  alignItems: 'start',
                }}
              >
                {/* HUGE ghost serif numeral */}
                <div
                  aria-hidden="true"
                  className="font-serif"
                  style={{
                    fontSize: 'clamp(64px,9vw,96px)',
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
                {/* Content */}
                <div>
                  <div className="div-accent" style={{ marginBottom: 20 }} />
                  <h3
                    className="font-serif t-h-lg"
                    style={{
                      color: 'var(--color-dark-charcoal)',
                      margin: '0 0 20px',
                      maxWidth: 760,
                      fontWeight: 400,
                      letterSpacing: '-0.018em',
                    }}
                  >
                    {t.title}
                  </h3>
                  <p
                    className="t-body-lg"
                    style={{ color: 'var(--color-charcoal)', margin: 0, maxWidth: 680, lineHeight: 1.7 }}
                  >
                    {t.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ paddingTop: 'clamp(40px,6vh,80px)', display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="#"
            className="btn-solid-dark"
            aria-label="Descargar código MATLAB"
          >
            DESCARGAR MATLAB
          </a>
          <a
            href="#"
            className="btn-outlined-azure"
            aria-label="Ver documentación Overleaf"
          >
            VER OVERLEAF
          </a>
        </div>
      </div>
    </SceneAnchor>
  );
}
