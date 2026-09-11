import { useAppStore } from '../store/appStore';
import LessonRunner from './LessonRunner';

// Left-docked lesson panel. Renders nothing (zero width) outside a lesson —
// vectors/shapes no longer live in a persistent sidebar list (see AddMenu +
// VectorPopups, floated next to the canvas legend instead), so this dock's
// only remaining job is keeping a lesson's content off the canvas: it used
// to float as a card over the top-center of the canvas, competing for space
// with the very thing it was explaining. Docking it here instead means the
// canvas stays fully visible for the whole lesson.
export default function LessonDock() {
  const isLessonActive = useAppStore((s) => s.activeLesson !== null);
  if (!isLessonActive) return null;

  return (
    <aside className="h-full w-[320px] shrink-0 flex flex-col bg-surface/90 backdrop-blur-md border-r border-line">
      <div className="h-11 flex items-center px-3 bg-accent shrink-0">
        <span className="text-white text-xs font-semibold uppercase tracking-widest">Lesson</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <LessonRunner />
      </div>
    </aside>
  );
}
