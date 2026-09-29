import { NavLink } from 'react-router-dom';
import { useAppStore, type Mode } from '../store/appStore';

const LINKS = [
  { to: '/', label: 'Playground' },
  { to: '/learn', label: 'Learn' },
];

const MODES: { value: Mode; label: string }[] = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
];

// Small 2x2 dot glyph standing in for a matrix — keeps the brand mark on-theme
// without pulling in an icon set for one spot.
function BrandMark() {
  return (
    <span className="grid grid-cols-2 gap-[3px] w-[13px] h-[13px] shrink-0">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="rounded-[1.5px] bg-accent" />
      ))}
    </span>
  );
}

export default function NavBar() {
  const activeLesson = useAppStore((s) => s.activeLesson);
  const exitLesson = useAppStore((s) => s.exitLesson);
  const mode = useAppStore((s) => s.mode);
  const setMode = useAppStore((s) => s.setMode);
  const isLocked = activeLesson !== null;

  return (
    <nav className="flex items-center gap-2 sm:gap-6 px-3 sm:px-6 h-14 border-b border-line bg-surface/80 backdrop-blur-md relative z-20">
      <NavLink
        to="/"
        onClick={(e) => { if (isLocked) e.preventDefault(); }}
        className={`flex items-center gap-2 font-semibold text-[15px] tracking-tight select-none transition-opacity ${
          isLocked ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80'
        }`}
        aria-disabled={isLocked}
      >
        <BrandMark />
        <span className="text-ink hidden sm:inline">Matrix<span className="text-accent">Canvas</span></span>
      </NavLink>

      <div className="flex gap-0.5 sm:gap-1 sm:ml-2">
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={(e) => { if (isLocked) e.preventDefault(); }}
            aria-disabled={isLocked}
            className={({ isActive }) =>
              `px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isLocked
                  ? 'text-ink-faint cursor-not-allowed'
                  : isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-ink-dim hover:text-ink hover:bg-white/5'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* 2D | 3D - switches the Playground canvas and which lessons Learn
          lists. Locked mid-lesson like the nav links: a lesson belongs to one
          dimension, so leave it (Exit Lesson) before switching. */}
      <div
        role="group"
        aria-label="Dimension"
        className={`flex p-0.5 rounded-lg border border-line bg-white/[0.03] ${isLocked ? 'opacity-50' : ''}`}
      >
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            disabled={isLocked}
            aria-pressed={mode === value}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              mode === value
                ? 'bg-accent text-white'
                : 'text-ink-dim hover:text-ink disabled:hover:text-ink-dim'
            } ${isLocked ? 'cursor-not-allowed' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLocked && (
        <button
          onClick={exitLesson}
          className="ml-auto px-3 py-1.5 rounded-lg bg-danger/15 hover:bg-danger/25 border border-danger/30
                     text-danger text-xs font-semibold transition-colors flex items-center gap-1.5"
          title="Exit the lesson"
        >
          <span aria-hidden>✕</span>
          Exit Lesson
        </button>
      )}
    </nav>
  );
}
