'use client';

const MARQUEE_PIECES = [
  'SET COVER',
  '500 ANTENAS',
  '22 ÓPTIMAS',
  'NP-DIFÍCIL',
  'BRANCH AND BOUND',
  'ALGORITMO GENÉTICO',
  'GAP 0.84%',
  'IO · UNAB',
  '2026',
];

function MarqueeRow() {
  return (
    <span
      className="t-meta"
      style={{
        color: 'color-mix(in srgb, var(--color-warm-cream) 70%, transparent)',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {MARQUEE_PIECES.map((p, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ padding: '0 22px' }}>{p}</span>
          {i < MARQUEE_PIECES.length - 1 && (
            <span
              aria-hidden="true"
              style={{
                display: 'inline-block',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'var(--color-burnt-sienna)',
                flexShrink: 0,
              }}
            />
          )}
        </span>
      ))}
      <span aria-hidden="true" style={{ padding: '0 22px' }}>·</span>
    </span>
  );
}

export function Marquee() {
  return (
    <div
      aria-label="Información del proyecto"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 44,
        background: 'rgba(16,9,4,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderTop: '1px solid var(--color-cork-shadow)',
        zIndex: 45,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 0,
          animation: 'marqueeScroll 50s linear infinite',
          willChange: 'transform',
        }}
      >
        <MarqueeRow />
        <MarqueeRow />
        <MarqueeRow />
        <MarqueeRow />
      </div>

      {/* Edge fades — purely cosmetic, no text */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background: 'linear-gradient(to right, rgba(16,9,4,1), transparent)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background: 'linear-gradient(to left, rgba(16,9,4,1), transparent)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-25%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-marquee] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
