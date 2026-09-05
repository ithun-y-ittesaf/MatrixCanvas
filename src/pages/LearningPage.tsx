import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { ALL_LESSONS } from '../lessons';
import type { Lesson, TrackType } from '../lessons/types';

const TRACKS: TrackType[] = ['beginner', 'intermediate', 'decompositions'];

const TRACK_LABELS: Record<TrackType, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  decompositions: 'Decompositions',
};

export default function LearningPage() {
  const navigate = useNavigate();
  const startLesson = useAppStore((s) => s.startLesson);

  // Starts the lesson in the store, then routes to the Playground — where
  // LessonRunner (already mounted there) picks up activeLesson and takes
  // over. Order matters: the store update happens before navigating so
  // there's no frame where Playground renders with no active lesson.
  const handleStart = (lesson: Lesson) => {
    startLesson(lesson);
    navigate('/');
  };

  return (
    <div className="flex flex-col items-center py-16 px-6 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-white mb-8">Learning Pathway</h1>

        <div className="flex flex-col gap-6">
          {TRACKS.map((track) => {
            const lessons = ALL_LESSONS.filter((l) => l.track === track);
            return (
              <div key={track}>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  {TRACK_LABELS[track]}
                </p>
                <div className="flex flex-col gap-1">
                  {lessons.length > 0 ? (
                    lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleStart(lesson)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/5
                                   bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10
                                   text-left transition-colors"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        <span className="text-sm text-slate-200">{lesson.title}</span>
                        <span className="ml-auto text-[10px] text-slate-600 uppercase tracking-wide">
                          {lesson.steps.length} step{lesson.steps.length === 1 ? '' : 's'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-3 text-xs text-slate-600">No lessons in this track yet.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
