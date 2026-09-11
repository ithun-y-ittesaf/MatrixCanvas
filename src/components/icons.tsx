// Small hand-rolled line-icon set (Feather/Lucide-style stroke conventions)
// so the toolbar/sidebar don't need an icon-library dependency for a
// handful of glyphs. Every icon takes a className and/or style — size comes
// from className, color from `currentColor` (a Tailwind text-* class, or a
// `style={{ color }}` for an arbitrary hex like a vector's own color).

import type { CSSProperties } from 'react';

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function PlusIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ChevronsLeftIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  );
}

export function ChevronsRightIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
}

export function ShareIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export function PlayIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

export function BracketsIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M9 4H7a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h2" />
      <path d="M15 4h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-2" />
    </svg>
  );
}

export function VectorIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="9 5 19 5 19 15" />
    </svg>
  );
}

export function RectangleIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
    </svg>
  );
}

export function TriangleIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M12 4 L20 20 L4 20 Z" strokeLinejoin="round" />
    </svg>
  );
}

export function PolygonIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} {...base}>
      <path d="M12 3 L21 9.5 L17.5 20 L6.5 20 L3 9.5 Z" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className, style }: IconProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
    >
      <line x1="5" y1="5" x2="15" y2="15" />
      <line x1="15" y1="5" x2="5" y2="15" />
    </svg>
  );
}
