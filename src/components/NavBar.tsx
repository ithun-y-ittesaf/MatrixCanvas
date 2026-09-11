import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

const LINKS = [
  { to: '/', label: 'Playground' },
  { to: '/learn', label: 'Learn' },
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
  const isLocked = activeLesson !== null;

  return (
    <nav className="flex items-center gap-6 px-6 h-14 border-b border-line bg-surface/80 backdrop-blur-md relative z-20">
      <NavLink
        to="/"
        onClick={(e) => { if (isLocked) e.preventDefault(); }}
        className={`flex items-center gap-2 font-semibold text-[15px] tracking-tight select-none transition-opacity ${
          isLocked ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80'
        }`}
        aria-disabled={isLocked}
      >
        <BrandMark />
        <span className="text-ink">Matrix<span className="text-accent">Canvas</span></span>
      </NavLink>

      <div className="flex gap-1 ml-2">
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={(e) => { if (isLocked) e.preventDefault(); }}
            aria-disabled={isLocked}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
