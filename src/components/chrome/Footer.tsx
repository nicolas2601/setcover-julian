'use client';

/**
 * Footer — GIC Night Sky section.
 * 3-col grid: wordmark+caption | nav links | autores+DOI.
 * Bottom hairline + copyright line.
 */

const NAV_LINKS = [
  { label: 'INTRO',      anchor: '#hero' },
  { label: 'PROBLEMA',   anchor: '#problema' },
  { label: 'MODELO',     anchor: '#formulacion' },
  { label: 'MÉTODOS',    anchor: '#exacto' },
  { label: 'RESULTADOS', anchor: '#comparacion' },
];

function scrollTo(anchor: string) {
  const id = anchor.replace('#', '');
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export function Footer() {
  return (
    <footer
      className="dark-section"
      aria-label="Pie de página"
      style={{
        paddingTop: 'var(--spacing-64)',
        paddingBottom: 'var(--spacing-64)',
        paddingLeft: 'var(--gutter)',
        paddingRight: 'var(--gutter)',
      }}
    >
      {/* Main 3-col grid */}
      <div
        style={{
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--spacing-40)',
          alignItems: 'start',
        }}
      >
        {/* LEFT — wordmark + project caption */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-12)',
          }}
        >
          <a
            href="#hero"
            onClick={(e) => { e.preventDefault(); scrollTo('#hero'); }}
            style={{
              fontFamily: 'var(--font-crimson), ui-serif, Georgia, serif',
              fontSize: '22px',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              color: 'var(--color-canvas-white)',
              textDecoration: 'none',
              fontFeatureSettings: '"liga" 0',
              lineHeight: 1.1,
            }}
            aria-label="SET COVER — Ir al inicio"
          >
            SET COVER
          </a>
          <p
            className="t-caption"
            style={{
              color: 'var(--color-light-gray)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              lineHeight: 1.6,
            }}
          >
            INVESTIGACIÓN DE OPERACIONES
            <br />
            UNAB · 2026
          </p>
        </div>

        {/* CENTER — nav anchors */}
        <nav
          aria-label="Navegación del pie de página"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-12)',
          }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.anchor}
              href={link.anchor}
              onClick={(e) => { e.preventDefault(); scrollTo(link.anchor); }}
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '13px',
                fontWeight: 400,
                letterSpacing: '-0.012em',
                color: 'var(--color-light-gray)',
                textDecoration: 'none',
                transition: 'color 200ms var(--ease-default)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-canvas-white)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-light-gray)';
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* RIGHT — autores + DOI */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-12)',
            alignItems: 'flex-end',
            textAlign: 'right',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '15px',
              fontWeight: 400,
              letterSpacing: '-0.012em',
              color: 'var(--color-canvas-white)',
              lineHeight: 1.4,
            }}
          >
            NICOLÁS · JULIÁN
          </p>
          <p
            className="t-caption"
            style={{
              color: 'var(--color-medium-gray)',
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.02em',
            }}
          >
            DOI: 10.xxxx/setcover-2026
          </p>
          <p
            className="t-caption"
            style={{
              color: 'var(--color-light-gray)',
              maxWidth: 240,
            }}
          >
            Proyecto de grado · Ingeniería de Sistemas · Universidad Autónoma de Bucaramanga
          </p>
        </div>
      </div>

      {/* Bottom hairline + copyright */}
      <div
        style={{
          maxWidth: 'var(--content-max)',
          margin: '0 auto',
          marginTop: 'var(--spacing-48)',
        }}
      >
        <div
          className="div-hairline"
          style={{ borderColor: 'var(--color-rich-black)', marginBottom: 'var(--spacing-24)' }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--spacing-8)',
          }}
        >
          <p
            className="t-caption"
            style={{ color: 'var(--color-medium-gray)' }}
          >
            &copy; 2026 SET COVER — UNAB · Investigación de Operaciones
          </p>
          <p
            className="t-caption"
            style={{
              color: 'var(--color-medium-gray)',
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
            }}
          >
            500 antenas · 500 clientes · GAP 0.84%
          </p>
        </div>
      </div>
    </footer>
  );
}
