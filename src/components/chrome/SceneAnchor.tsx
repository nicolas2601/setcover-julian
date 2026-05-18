import type { CSSProperties, ReactNode } from 'react';

interface SceneAnchorProps {
  id: string;
  n: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  children: ReactNode;
}

/**
 * SceneAnchor — server-safe section wrapper.
 * No client JS, purely structural. Each scene gets its own id + data-scene.
 */
export default function SceneAnchor({
  id,
  n,
  className = '',
  style,
  ariaLabel,
  children,
}: SceneAnchorProps) {
  return (
    <section
      id={id}
      data-scene={n}
      className={className}
      style={style}
      aria-label={ariaLabel ?? `Scene ${n}`}
    >
      {children}
    </section>
  );
}
