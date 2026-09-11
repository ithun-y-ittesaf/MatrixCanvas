import { useAppStore } from '../store/appStore';
import { ALL_LESSONS } from '../lessons';

// Jumps between whole lessons (not steps within one — LessonRunner's own
// Prev/Next already do that) — the next/previous entry in the curriculum's
// flat lesson order, same list LearningPage renders.
export default function LessonNav() {
  const activeLesson = useAppStore((s) => s.activeLesson);
  const startLesson = useAppStore((s) => s.startLesson);

  if (!activeLesson) return null;

  const index = ALL_LESSONS.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = index > 0 ? ALL_LESSONS[index - 1] : null;
  const nextLesson = index >= 0 && index < ALL_LESSONS.length - 1 ? ALL_LESSONS[index + 1] : null;

  return (
    <div className="flex items-center gap-2 font-sans">
      <button
        onClick={() => prevLesson && startLesson(prevLesson)}
        disabled={!prevLesson}
        title={prevLesson?.title}
        className="px-3 py-2 rounded-lg border border-line bg-surface/70 backdrop-blur-md shadow-xl
                   text-ink-dim text-xs hover:text-ink hover:border-line-strong transition-colors
                   disabled:opacity-30 disabled:pointer-events-none"
      >
        ← Prev Lesson
      </button>
      <button
        onClick={() => nextLesson && startLesson(nextLesson)}
        disabled={!nextLesson}
        title={nextLesson?.title}
        className="px-3 py-2 rounded-lg bg-accent hover:bg-accent-strong active:scale-95 shadow-xl
                   text-white text-xs font-semibold transition-all
                   disabled:opacity-30 disabled:pointer-events-none disabled:active:scale-100"
      >
        Next Lesson →
      </button>
    </div>
  );
}
