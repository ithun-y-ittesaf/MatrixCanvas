import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAppStore } from '../store/appStore';
import PropertiesPanel from './PropertiesPanel';
import { useCopyLink } from '../utils/useCopyLink';
import { katexHtml } from '../utils/katexHtml';
import { PRESETS } from '../utils/presets';
import { ShareIcon, BracketsIcon } from './icons';

type PopoverKind = 'presets' | 'properties' | null;

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
  const setMatrixValues = useAppStore((s) => s.setMatrixValues);
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
      </div>

      {open === 'properties' && (
        <div className="rounded-xl border border-line bg-surface/85 backdrop-blur-md shadow-2xl px-4 py-3" style={{ minWidth: 190 }}>
          <p className="text-ink-faint uppercase tracking-widest text-[10px] mb-1.5">Properties</p>
          <PropertiesPanel />
        </div>
      )}

      {open === 'presets' && (
        <div className="rounded-xl border border-line bg-surface/85 backdrop-blur-md shadow-2xl overflow-hidden" style={{ minWidth: 180 }}>
          {PRESETS.map((p) => (
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
      )}
    </div>
  );
}
