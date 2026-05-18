'use client';

import { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      const id = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(id);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      const id = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(id);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copiado' : 'Copiar código'}
      className="btn-ghost"
      style={{
        padding: '4px 12px',
        fontSize: '11px',
        borderRadius: '999px',
        letterSpacing: '0.04em',
        minWidth: 72,
        transition: 'border-color 240ms, color 240ms',
        borderColor: copied
          ? 'var(--color-burnt-sienna)'
          : undefined,
        color: copied
          ? 'var(--color-burnt-sienna)'
          : undefined,
      }}
    >
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}
