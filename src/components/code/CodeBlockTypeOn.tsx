'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import hljs from 'highlight.js/lib/core';
import matlab from 'highlight.js/lib/languages/matlab';
import { CopyButton } from './CopyButton';

hljs.registerLanguage('matlab', matlab);

// ---- helpers ---------------------------------------------------------------

function highlightLinesHtml(html: string, lines: number[]): string {
  if (!lines.length) return html;
  const set = new Set(lines);
  return html
    .split('\n')
    .map((line, i) => {
      if (set.has(i + 1)) {
        return `<span class="hljs-line-highlight">${line}</span>`;
      }
      return line;
    })
    .join('\n');
}

function highlightCode(code: string, language: string): string {
  try {
    return hljs.highlight(code, { language }).value;
  } catch {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// Strip HTML tags to count raw characters for type-on pacing
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

// Reveal first N plain-text characters of highlighted HTML,
// keeping all HTML tags intact but hiding content beyond limit.
function revealHtmlChars(html: string, charLimit: number): string {
  let count = 0;
  let result = '';
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      // Pass through entire tag
      const close = html.indexOf('>', i);
      if (close === -1) {
        result += html.slice(i);
        break;
      }
      result += html.slice(i, close + 1);
      i = close + 1;
    } else if (html[i] === '&') {
      // HTML entity counts as 1 character
      const semi = html.indexOf(';', i);
      if (semi === -1 || semi - i > 8) {
        if (count < charLimit) { result += html[i]; count++; }
        i++;
      } else {
        if (count < charLimit) {
          result += html.slice(i, semi + 1);
          count++;
        }
        i = semi + 1;
      }
    } else {
      if (count < charLimit) {
        result += html[i];
        count++;
      }
      i++;
    }
  }

  return result;
}

// ---- types -----------------------------------------------------------------

export interface CodeBlockTypeOnProps {
  code: string;
  language?: string;
  filename?: string;
  highlightLines?: number[];
  showLineNumbers?: boolean;
  showCopy?: boolean;
  /** ms per character — capped so total <= 2500ms */
  charDelay?: number;
  /** Trigger animation when element enters viewport */
  triggerOnView?: boolean;
}

// ---- component -------------------------------------------------------------

export function CodeBlockTypeOn({
  code,
  language = 'matlab',
  filename,
  highlightLines: focusLines = [],
  showLineNumbers = true,
  showCopy = true,
  charDelay = 40,
  triggerOnView = true,
}: CodeBlockTypeOnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Pre-compute highlighted HTML once
  const fullHtml = highlightLinesHtml(highlightCode(code, language), focusLines);
  const totalChars = stripTags(fullHtml).length;

  // Cap delay so total animation <= 2500ms
  const effectiveDelay = Math.min(charDelay, Math.floor(2500 / Math.max(totalChars, 1)));

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const runAnimation = useCallback(() => {
    if (prefersReducedMotion) {
      setRevealedCount(totalChars);
      setDone(true);
      return;
    }

    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const chars = Math.min(
        totalChars,
        Math.floor(elapsed / effectiveDelay)
      );
      setRevealedCount(chars);

      if (chars >= totalChars) {
        setDone(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [totalChars, effectiveDelay, prefersReducedMotion]);

  // Intersection Observer
  useEffect(() => {
    if (!triggerOnView) {
      setStarted(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerOnView, started]);

  // Start typing when triggered
  useEffect(() => {
    if (started && !done) {
      runAnimation();
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [started, done, runAnimation]);

  // Compute visible HTML slice
  const visibleHtml = done
    ? fullHtml
    : revealedCount === 0
      ? ''
      : revealHtmlChars(fullHtml, revealedCount);

  const rawLines = code.split('\n');
  const lineCount = rawLines.length;

  // Show cursor during animation
  const showCursor = started && !done;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%', fontFamily: 'var(--t-mono)' }}
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
          background: 'var(--color-deep-cork)',
          borderBottom: '1px solid var(--color-cork-shadow)',
        }}
      >
        <span
          className="t-caption"
          style={{
            color: 'var(--color-grey-brown)',
            fontFamily: 'var(--t-mono)',
            letterSpacing: '0.04em',
          }}
        >
          {filename ?? `snippet.${language}`}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-warm-cream)',
              opacity: 0.5,
              border: '1px solid color-mix(in srgb, var(--color-warm-cream) 20%, transparent)',
              borderRadius: 999,
              padding: '2px 8px',
              fontFamily: 'var(--t-mono)',
            }}
          >
            {language.toUpperCase()}
          </span>

          {showCopy && done && <CopyButton text={code} />}
        </div>
      </div>

      {/* Code area */}
      <div style={{ display: 'flex', overflow: 'auto', background: 'var(--color-deep-cork)' }}>
        {/* Line gutter */}
        {showLineNumbers && (
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              padding: '24px 12px 24px 16px',
              borderRight: '1px solid var(--color-cork-shadow)',
              textAlign: 'right',
              userSelect: 'none',
              lineHeight: 1.75,
              fontSize: '13.5px',
              color: 'var(--color-grey-brown)',
              fontFamily: 'var(--t-mono)',
              opacity: 0.5,
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
          style={{ flex: 1, margin: 0, borderRadius: 0, overflowX: 'auto' }}
        >
          <code
            className={`language-${language}`}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: visibleHtml + (showCursor ? '<span class="code-cursor">▌</span>' : ''),
            }}
          />
        </pre>
      </div>

      {/* Bottom dashed divider */}
      <div className="div-dashed" />

      {/* Cursor blink style */}
      <style>{`
        .code-cursor {
          display: inline-block;
          color: var(--color-burnt-sienna);
          animation: cursor-blink 0.8s step-start infinite;
          font-weight: 400;
          user-select: none;
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .code-cursor { animation: none; }
        }
      `}</style>
    </div>
  );
}
