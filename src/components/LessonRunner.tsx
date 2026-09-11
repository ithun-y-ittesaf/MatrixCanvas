import { useEffect, useMemo, useRef } from 'react';
import katex from 'katex';
import { useAppStore } from '../store/appStore';
import DecompositionPlayer from './DecompositionPlayer';
import { buildDecompositionSequence } from '../math/decompositionSequences';

// Steps a user through the active lesson. Reads activeLesson/activeStepIndex
// straight from the store and renders nothing when no lesson is running.
//
// Content-only — no positioning or card chrome of its own. It used to float
// as its own top-center modal over the canvas, but that put it in direct
// competition for screen space with the very thing it's explaining (a
// lesson step's vectors/shapes are drawn centered on the canvas too, so a
// big enough shape ended up hidden behind the card). LessonDock now mounts
// this in its own slot instead — a lesson runs *in* the dock, never on top
// of the canvas, so the whole canvas stays visible for as long as the
// lesson is running. Same reasoning is why DecompositionPlayer renders
// in-flow below rather than as its own floating bottom-center card: that
// spot is already the equation bar + scrub bar's.
//
// Exit lives in NavBar now, not here — a dedicated "Exit Lesson" button,
// rather than a separate control repeating the same action in two places.
export default function LessonRunner() {
  const activeLesson = useAppStore((s) => s.activeLesson);
  const activeStepIndex = useAppStore((s) => s.activeStepIndex);
  const nextStep = useAppStore((s) => s.nextStep);
  const prevStep = useAppStore((s) => s.prevStep);

  const step = activeLesson?.steps[activeStepIndex] ?? null;

  // Standard katex render-to-DOM-node usage: hand it the container element
  // directly rather than dangerouslySetInnerHTML-ing katex.renderToString,
  // so it can manage its own DOM (MathML + HTML fallback) for us.
  const katexRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = katexRef.current;
    if (!el) return;
    el.replaceChildren();
    if (step?.katex) {
      katex.render(step.katex, el, { throwOnError: false, displayMode: true });
    }
  }, [step]);

  // A decomposition-track step opts into DecompositionPlayer by setting
  // `decomposition`; buildDecompositionSequence turns that + the step's own
  // `matrix` into the labeled stop sequence the player animates through.
  // Memoized on `step` (stable per lesson step, since lesson content is
  // static data) so this doesn't get recomputed — and DecompositionPlayer's
  // own reset effect doesn't get spuriously retriggered — on every render.
  const decompositionSequence = useMemo(
    () => (step?.decomposition ? buildDecompositionSequence(step.decomposition, step.matrix) : null),
    [step],
  );

  if (!activeLesson || !step) return null;

  const stepNumber = activeStepIndex + 1;
  const totalSteps = activeLesson.steps.length;
  const isFirstStep = activeStepIndex === 0;
  const isLastStep = stepNumber === totalSteps;

  return (
    <div className="flex flex-col gap-3 font-sans p-3">
      <p className="text-ink-faint uppercase tracking-widest text-[10px] truncate">
        {activeLesson.title}
      </p>

      <div>
        <h2 className="text-ink font-semibold text-base">{step.title}</h2>
        {/* explanation is plain text (see LessonStep in lessons/types.ts) */}
        <p className="text-ink-dim text-sm mt-1 whitespace-pre-wrap">{step.explanation}</p>
      </div>

      <div ref={katexRef} className={step.katex ? 'py-1 overflow-x-auto' : undefined} />

      {/* Set but not buildable (e.g. an eigen step authored against a
          rotation matrix) — flag it rather than silently showing nothing. */}
      {step.decomposition && !decompositionSequence && (
        <p className="text-warn/80 text-xs">
          This matrix has no real {step.decomposition.toUpperCase()} decomposition to animate.
        </p>
      )}

      {/* Step progress dots — a quick at-a-glance sense of how much of the
          lesson is left, and which steps have already been visited. */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {activeLesson.steps.map((s, i) => (
          <span
            key={s.id}
            className={`h-1.5 rounded-full transition-all ${
              i === activeStepIndex
                ? 'w-4 bg-accent'
                : i < activeStepIndex
                  ? 'w-1.5 bg-accent/40'
                  : 'w-1.5 bg-line-strong'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          className="px-3 py-1.5 rounded-lg border border-line text-ink-dim text-xs
                     hover:text-ink hover:border-line-strong transition-colors
                     disabled:opacity-30 disabled:pointer-events-none"
        >
          ← Prev
        </button>

        <span className="text-ink-faint text-xs shrink-0 whitespace-nowrap">
          {stepNumber} / {totalSteps}
        </span>

        <button
          onClick={nextStep}
          disabled={isLastStep}
          className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-strong active:scale-95
                     text-white text-xs font-semibold transition-all
                     disabled:opacity-30 disabled:pointer-events-none disabled:active:scale-100"
        >
          Next →
        </button>
      </div>

      {/* Its own Prev/Replay/Next (stepping through the decomposition's
          stops) reads as distinct from the lesson-step Prev/Next above —
          `!w-full` overrides DecompositionPlayer's own fixed card width
          (it's designed to also work as a freestanding floating card
          elsewhere) so it sits naturally in the dock's column instead. */}
      {decompositionSequence && (
        <DecompositionPlayer sequence={decompositionSequence} className="!w-full" />
      )}
    </div>
  );
}
