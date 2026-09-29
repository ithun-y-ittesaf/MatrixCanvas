import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppStore, type Overlay3d } from '../store/appStore';
import PropertiesPanel from './PropertiesPanel';
import PropertiesPanel3D from './PropertiesPanel3D';
import { useCopyLink } from '../utils/useCopyLink';
import { katexHtml } from '../utils/katexHtml';
import { PRESETS, PRESETS_3D } from '../utils/presets';
import { ShareIcon, BracketsIcon, LayersIcon } from './icons';

type PopoverKind = 'presets' | 'properties' | 'overlays' | null;

// 3D-only "Show" toggles: geometric extras drawn from the current matrix.
const OVERLAY_OPTIONS: { key: Overlay3d; label: string; hint: string }[] = [
  { key: 'unitSphere', label: 'Unit sphere', hint: 'Watch it become an ellipsoid' },
  { key: 'singularAxes', label: 'Singular axes', hint: 'Ellipsoid semi-axes (σᵢ·uᵢ)' },
  { key: 'eigenvectors', label: 'Eigenvectors', hint: 'Lines the transform keeps fixed' },
  { key: 'nullSpace', label: 'Null space', hint: 'Everything sent to the origin' },
  { key: 'columnSpace', label: 'Column space', hint: 'Everything the matrix can reach' },
];

function ToolbarButton({
  active = false,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
        active
          ? 'bg-accent text-white'
          : 'text-ink-dim hover:text-ink hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  );
}

// Compact icon rail: Share fires immediately; [ ] and x² each open a
// popover directly beneath the rail (mutually exclusive — opening one
// closes the other). [ ] opens Properties (det/trace/eigen/...) — the
// bracket reads as "inspect this matrix". x² opens the preset-transform
// menu — matrix editing itself now lives inline in the always-visible
// equation panel (MatrixBracket), and Animate moved to the scrub bar
// underneath it, so neither needs a toolbar slot of its own any more.
export default function CanvasToolbar() {
  const isLessonActive = useAppStore((s) => s.activeLesson !== null);
  const mode = useAppStore((s) => s.mode);
  const is3d = mode === '3d';
  const setMatrixValues = useAppStore((s) => s.setMatrixValues);
  const setMatrixValues3d = useAppStore((s) => s.setMatrixValues3d);
  const overlays3d = useAppStore((s) => s.overlays3d);
  const toggleOverlay3d = useAppStore((s) => s.toggleOverlay3d);
  const { copied, copyLink } = useCopyLink();
  const [open, setOpen] = useState<PopoverKind>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // A lesson starting mid-popover shouldn't leave a free-play editor
  // floating (dimmed but still reachable) over the lesson dock.
  useEffect(() => {
    if (isLessonActive) setOpen(null);
  }, [isLessonActive]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (kind: PopoverKind) => setOpen((o) => (o === kind ? null : kind));

  return (
    <div ref={containerRef} className="flex flex-col items-end gap-2 font-sans">
      <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface/80 backdrop-blur-md shadow-2xl p-1.5">
        <div className="relative">
          <ToolbarButton title="Copy link" onClick={copyLink}>
            <ShareIcon className={`w-[18px] h-[18px] ${copied ? 'text-success' : ''}`} />
          </ToolbarButton>

          {copied && (
            <div
              className="toast-pop absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1.5
                         rounded-lg bg-surface-raised border border-line shadow-xl text-xs text-ink
                         whitespace-nowrap pointer-events-none"
            >
              Link copied!
            </div>
          )}
        </div>

        <ToolbarButton title="Properties" active={open === 'properties'} onClick={() => toggle('properties')}>
          <BracketsIcon className="w-[18px] h-[18px]" />
        </ToolbarButton>

        <ToolbarButton title="Presets" active={open === 'presets'} onClick={() => toggle('presets')}>
          <span
            className={open === 'presets' ? 'text-white' : 'text-ink-dim'}
            dangerouslySetInnerHTML={katexHtml('x^2')}
          />
        </ToolbarButton>

        {is3d && (
          <ToolbarButton title="Show overlays" active={open === 'overlays'} onClick={() => toggle('overlays')}>
            <LayersIcon className="w-[18px] h-[18px]" />
          </ToolbarButton>
        )}
      </div>

      {open === 'properties' && (
        <div className="rounded-xl border border-line bg-surface/85 backdrop-blur-md shadow-2xl px-4 py-3" style={{ minWidth: 190 }}>
          <p className="text-ink-faint uppercase tracking-widest text-[10px] mb-1.5">Properties</p>
          {is3d ? <PropertiesPanel3D /> : <PropertiesPanel />}
        </div>
      )}

      {open === 'overlays' && is3d && (
        <div className="rounded-xl border border-line bg-surface/85 backdrop-blur-md shadow-2xl py-1.5" style={{ minWidth: 220 }}>
          <p className="text-ink-faint uppercase tracking-widest text-[10px] px-3 pt-1 pb-1">Show</p>
          {OVERLAY_OPTIONS.map(({ key, label, hint }) => {
            const on = overlays3d.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleOverlay3d(key)}
                aria-pressed={on}
                className="w-full flex items-start gap-2.5 px-3 py-1.5 text-left hover:bg-white/5 transition-colors"
              >
                <span
                  className={`mt-0.5 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[10px] leading-none ${
                    on ? 'bg-accent border-accent text-white' : 'border-line-strong text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="flex flex-col">
                  <span className={`text-sm ${on ? 'text-ink' : 'text-ink-dim'}`}>{label}</span>
                  <span className="text-[10px] text-ink-faint">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {open === 'presets' && (
        <div className="rounded-xl border border-line bg-surface/85 backdrop-blur-md shadow-2xl overflow-hidden" style={{ minWidth: 180 }}>
          <div className={is3d ? 'max-h-[60vh] overflow-y-auto' : undefined}>
            {is3d
              ? PRESETS_3D.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setMatrixValues3d(p.values); setOpen(null); }}
                    className="block w-full text-left px-3 py-2 text-sm text-ink-dim
                               hover:bg-white/5 hover:text-ink transition-colors"
                  >
                    {p.label}
                  </button>
                ))
              : PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { setMatrixValues(p.values); setOpen(null); }}
                    className="block w-full text-left px-3 py-2 text-sm text-ink-dim
                               hover:bg-white/5 hover:text-ink transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}
