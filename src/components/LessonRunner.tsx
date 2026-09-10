import { useEffect, useMemo, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useAppStore } from '../store/appStore';
import DecompositionPlayer from './DecompositionPlayer';
import { buildDecompositionSequence } from '../math/decompositionSequences';

// Floating panel that steps a user through the active lesson. Reads
// activeLesson/activeStepIndex straight from the store and renders nothing
// when no lesson is running, so it can just be mounted alongside the rest of
// PlaygroundPage's panels unconditionally — same as how a lesson step itself
// only *pushes into* matrixValues/customVectors/shapes rather than replacing
// them, TransformCanvas and friends have no idea this panel exists.
export default function LessonRunner() {
  const activeLesson = useAppStore((s) => s.activeLesson);
  const activeStepIndex = useAppStore((s) => s.activeStepIndex);
  const nextStep = useAppStore((s) => s.nextStep);
  const prevStep = useAppStore((s) => s.prevStep);
  const exitLesson = useAppStore((s) => s.exitLesson);

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
    <>
      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 w-[92vw] max-w-[400px] rounded-xl
                   border border-white/10 px-5 py-4 bg-black/50 backdrop-blur-md shadow-2xl
                   flex flex-col gap-3 font-sans"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-slate-500 uppercase tracking-widest text-[10px]">
            {activeLesson.title}
          </p>
          <button
            onClick={exitLesson}
            className="text-slate-500 hover:text-red-400 text-xs transition-colors shrink-0"
          >
            Exit ✕
          </button>
        </div>

        <div>
          <h2 className="text-white font-semibold text-base">{step.title}</h2>
          {/* explanation is plain text (see LessonStep in lessons/types.ts) */}
          <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{step.explanation}</p>
        </div>

        <div ref={katexRef} className={step.katex ? 'py-1 overflow-x-auto' : undefined} />

        {/* Set but not buildable (e.g. an eigen step authored against a
            rotation matrix) — flag it rather than silently showing nothing. */}
        {step.decomposition && !decompositionSequence && (
          <p className="text-amber-400 text-xs">
            This matrix has no real {step.decomposition.toUpperCase()} decomposition to animate.
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs
                       hover:text-white hover:border-white/20 transition-colors
                       disabled:opacity-30 disabled:pointer-events-none"
          >
            ← Prev
          </button>

          <span className="text-slate-500 text-xs shrink-0 whitespace-nowrap">
            Step {stepNumber} of {totalSteps}
          </span>

          <button
            onClick={nextStep}
            disabled={isLastStep}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95
                       text-white text-xs font-semibold transition-all
                       disabled:opacity-30 disabled:pointer-events-none disabled:active:scale-100"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Decomposition-track step: the sub-animation lives in its own card,
          bottom-center, so its Prev/Replay/Next (stepping through the
          decomposition's stops) reads as distinct from this card's Prev/Next
          (stepping through the lesson's steps) above. */}
      {decompositionSequence && (
        <DecompositionPlayer
          sequence={decompositionSequence}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        />
      )}
    </>
  );
}
