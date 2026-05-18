import hljs from 'highlight.js/lib/core';
import matlab from 'highlight.js/lib/languages/matlab';
import { CopyButton } from './CopyButton';

hljs.registerLanguage('matlab', matlab);

// ---- helpers ---------------------------------------------------------------

function highlightLines(html: string, lines: number[]): string {
  if (!lines.length) return html;
  const set = new Set(lines);
  const rawLines = html.split('\n');
  return rawLines
    .map((line, i) => {
      const lineNum = i + 1;
      if (set.has(lineNum)) {
        return `<span class="hljs-line-highlight">${line}</span>`;
      }
      return line;
    })
    .join('\n');
}

// ---- types -----------------------------------------------------------------

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  /** 1-based line numbers to highlight */
  highlightLines?: number[];
  showLineNumbers?: boolean;
  showCopy?: boolean;
}

// ---- component -------------------------------------------------------------

export function CodeBlock({
  code,
  language = 'matlab',
  filename,
  highlightLines: focusLines = [],
  showLineNumbers = true,
  showCopy = true,
}: CodeBlockProps) {
  // Sync highlight.js — safe in Server Component
  let highlighted: string;
  try {
    highlighted = hljs.highlight(code, { language }).value;
  } catch {
    highlighted = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Post-process: wrap focus lines
  const processedHtml = highlightLines(highlighted, focusLines);

  // Split into lines for gutter
  const rawLines = code.split('\n');
  const lineCount = rawLines.length;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: 'var(--t-mono)',
      }}
    >
      {/* Top dashed divider */}
      <div className="div-dashed" />

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px 8px 28px',
          background: 'var(--color-ash-gray)',
          borderBottom: '1px solid var(--color-steel-gray)',
        }}
      >
        {/* Filename caption */}
        <span
          className="t-caption"
          style={{
            color: 'var(--color-medium-gray)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}
        >
          {filename ?? `snippet.${language}`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Lang chip — ghost pill */}
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-medium-gray)',
              opacity: 0.7,
              border: '1px solid var(--color-steel-gray)',
              borderRadius: 999,
              padding: '2px 8px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {language.toUpperCase()}
          </span>

          {showCopy && <CopyButton text={code} />}
        </div>
      </div>

      {/* Code area */}
      <div style={{ display: 'flex', overflow: 'auto', background: 'var(--color-ash-gray)' }}>
        {/* Line gutter */}
        {showLineNumbers && (
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              padding: '24px 12px 24px 16px',
              borderRight: '1px solid var(--color-steel-gray)',
              textAlign: 'right',
              userSelect: 'none',
              lineHeight: 1.75,
              fontSize: '13.5px',
              color: 'var(--color-medium-gray)',
              fontFamily: 'var(--font-mono)',
              opacity: 0.6,
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
        )}

        {/* Highlighted code */}
        <pre
          className="hljs"
          style={{
            flex: 1,
            margin: 0,
            borderRadius: 0,
            overflowX: 'auto',
          }}
        >
          <code
            className={`language-${language}`}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        </pre>
      </div>

      {/* Bottom dashed divider */}
      <div className="div-dashed" />
    </div>
  );
}
