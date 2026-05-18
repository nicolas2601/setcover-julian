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

export function Scene09_Conclusions() {
  return (
    <SceneAnchor id="conclusiones" n={9} ariaLabel="Conclusiones — tres lecciones del proyecto" style={{ background: 'var(--color-studio-black)' }}>
      <div className="container-max" style={{ padding: 'var(--section-gap) var(--gutter)' }}>
        <Reveal>
          <p className="t-meta" style={{ color: 'var(--color-grey-brown)', marginBottom: 32 }}>09 · CONCLUSIONES</p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            className="t-display-xl"
            style={{
              color: 'var(--color-warm-cream)',
              margin: '0 0 clamp(48px,8vh,112px)',
              maxWidth: 1100,
              lineHeight: 0.92,
            }}
          >
            <span style={{ display: 'block' }}>Tres&nbsp;lecciones.</span>
            <span style={{ display: 'inline-flex', alignItems: 'flex-start', gap: '0.04em' }}>
              <span>Un&nbsp;problema&nbsp;de&nbsp;2</span>
              <span
                style={{
                  fontSize: '0.42em',
                  lineHeight: 1,
                  color: 'var(--color-burnt-sienna)',
                  marginTop: '0.04em',
                  fontWeight: 500,
                }}
              >
                500
              </span>
              <span>.</span>
            </span>
          </h2>
        </Reveal>

        {/* Takeaway sections */}
        <div>
          {TAKEAWAYS.map((t, i) => (
            <Reveal key={t.numeral} delay={i * 0.06}>
              <div style={{ position: 'relative', padding: 'clamp(40px,6vh,80px) 0', borderBottom: '1px dashed var(--color-cork-shadow)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'start' }}>
                {/* HUGE ghost numeral */}
                <div
                  aria-hidden="true"
                  className="t-display-2xl"
                  style={{ color: 'color-mix(in srgb, var(--color-warm-cream) 6%, transparent)', lineHeight: 0.82, userSelect: 'none', minWidth: '1.2ch' }}
                >
                  {t.numeral}
                </div>
                {/* Content */}
                <div>
                  <div className="div-accent" style={{ marginBottom: 20 }} />
                  <h3 className="t-h-lg" style={{ color: 'var(--color-warm-cream)', margin: '0 0 20px', maxWidth: 760 }}>
                    {t.title}
                  </h3>
                  <p className="t-body-lg" style={{ color: 'var(--color-grey-brown)', margin: 0, maxWidth: 680, lineHeight: 1.65 }}>
                    {t.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ paddingTop: 'clamp(40px,6vh,80px)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a
            href="#"
            className="btn-pill"
            aria-label="Descargar código MATLAB"
          >
            DESCARGAR MATLAB
          </a>
          <a
            href="#"
            className="btn-ghost"
            aria-label="Ver documentación Overleaf"
          >
            VER OVERLEAF
          </a>
        </div>
      </div>
    </SceneAnchor>
  );
}
