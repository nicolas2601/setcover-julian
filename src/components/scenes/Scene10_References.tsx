import SceneAnchor from '@/components/chrome/SceneAnchor';

// ─── IEEE references (server component — no 'use client') ────────────────────
const REFS = [
  {
    n: 1,
    author: 'Caprara, A., Toth, P., Fischetti, M.',
    year: 1999,
    title: 'Algorithms for the Set Covering Problem',
    venue: 'Annals of Operations Research',
    doi: '10.1023/A:1018981814765',
  },
  {
    n: 2,
    author: 'Hochbaum, D. S.',
    year: 1982,
    title: 'Approximation Algorithms for the Set Covering and Vertex Cover Problems',
    venue: 'SIAM Journal on Computing',
    doi: '10.1137/0211038',
  },
  {
    n: 3,
    author: 'Beasley, J. E.',
    year: 1990,
    title: 'A Lagrangian Relaxation Based Heuristic for the Weighted Set Covering Problem',
    venue: 'European Journal of Operational Research',
    doi: '10.1016/0377-2217(90)90160-M',
  },
  {
    n: 4,
    author: 'Holland, J. H.',
    year: 1975,
    title: 'Adaptation in Natural and Artificial Systems',
    venue: 'University of Michigan Press',
    doi: '10.7551/mitpress/1090.001.0001',
  },
  {
    n: 5,
    author: 'Land, A. H., Doig, A. G.',
    year: 1960,
    title: 'An Automatic Method of Solving Discrete Programming Problems',
    venue: 'Econometrica',
    doi: '10.2307/1910129',
  },
];

// ─── Scene 10 — LIGHT ────────────────────────────────────────────────────────
export function Scene10_References() {
  return (
    <SceneAnchor
      id="referencias"
      n={10}
      ariaLabel="Referencias bibliográficas IEEE"
      style={{ background: 'var(--color-off-white)' }}
    >
      <div
        className="container-max"
        style={{ padding: 'var(--section-gap) var(--gutter) clamp(80px,12vh,160px)' }}
      >
        <p
          className="t-caption tracking-meta"
          style={{ color: 'var(--color-medium-gray)', marginBottom: 32 }}
        >
          10 · REFERENCIAS · IEEE
        </p>

        <h2
          className="font-serif t-h-lg"
          style={{
            color: 'var(--color-dark-charcoal)',
            margin: '0 0 clamp(48px,7vh,96px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}
        >
          Bibliografía.
        </h2>

        {/* Reference list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {REFS.map((ref) => (
            <div key={ref.n}>
              <div className="div-cool" />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 'clamp(20px,3vw,48px)',
                  padding: 'clamp(24px,3vh,40px) 0',
                  alignItems: 'baseline',
                }}
              >
                <span
                  className="font-mono tnum"
                  style={{
                    fontSize: 12,
                    color: 'var(--color-medium-gray)',
                    letterSpacing: '0.08em',
                    minWidth: 28,
                  }}
                >
                  [{ref.n}]
                </span>
                <div>
                  <p
                    className="t-body-lg"
                    style={{ color: 'var(--color-dark-charcoal)', margin: '0 0 8px', lineHeight: 1.6 }}
                  >
                    {ref.author} ({ref.year}) —{' '}
                    <em style={{ fontStyle: 'italic', color: 'var(--color-charcoal)' }}>{ref.title}.</em>{' '}
                    <span style={{ color: 'var(--color-slate-gray)' }}>{ref.venue}.</span>
                  </p>
                  <a
                    href={`https://doi.org/${ref.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-caption"
                    style={{
                      color: 'var(--color-cofounder-blue)',
                      textDecoration: 'none',
                      borderBottom: '1px solid var(--color-cofounder-blue)',
                      paddingBottom: 1,
                      transition: 'opacity 200ms',
                    }}
                    aria-label={`DOI ${ref.doi}`}
                  >
                    DOI: {ref.doi}
                  </a>
                </div>
              </div>
            </div>
          ))}
          <div className="div-cool" />
        </div>

        {/* Footer caption */}
        <div className="div-hairline" style={{ marginTop: 'clamp(48px,7vh,96px)' }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
          }}
        >
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>
            NICOLÁS · JULIÁN · UNAB IO · 2026
          </span>
          <span className="t-caption" style={{ color: 'var(--color-medium-gray)' }}>
            SET COVER 500×500
          </span>
        </div>
      </div>
    </SceneAnchor>
  );
}
