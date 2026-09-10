import { useEffect, useMemo, useState } from 'react';
import type { DecompositionSequence } from '../math/decompositionSequences';
import { useAppStore } from '../store/appStore';

// Drives TransformCanvas through a decomposition's stop sequence, one tween
// per stop, via the store's triggerAnimationFrom (see appStore.ts) — the same
// GSAP-backed mechanism the Playground's "Animate" button uses
// (animFrom/matrixValues/animProgress/animTrigger), just pointed at an
// arbitrary from/to pair each time instead of always starting from identity.
// No parallel animation system: every Prev/Next/Replay click is one more
// call into that same store action.
//
// Usable standalone — pass any DecompositionSequence, e.g. from
// math/decompositionSequences.ts's svdSequence/eigenSequence/luSequence/
// qrSequence — or as a decomposition-track lesson step's visualization; see
// the integration in LessonRunner.tsx.
//
// IMPORTANT: `sequence` should be derived from something the player itself
// doesn't drive (e.g. a lesson step's static `matrix`, or a matrix chosen
// before pressing "play"), not reactively from the store's own matrixValues —
// this component's own triggerAnimationFrom calls write matrixValues, so
// computing `sequence` from it would recompute a new sequence on every step
// and fight itself.
//
// Unlike the other floating panels (MatrixInput, VectorPanel, ...), this
// component doesn't position itself with `absolute` — that's left to the
// caller (via `className`) since it's meant to be usable in more than one
// layout (standalone demo, or embedded by LessonRunner).
interface DecompositionPlayerProps {
  sequence: DecompositionSequence;
  className?: string;
}

export default function DecompositionPlayer({ sequence, className }: DecompositionPlayerProps) {
  const triggerAnimationFrom = useAppStore((s) => s.triggerAnimationFrom);

  // 0 = sitting at sequence.start (nothing animated yet); N = fully at
  // sequence.steps[N - 1].matrix.
  const [stepIndex, setStepIndex] = useState(0);

  const stops = useMemo(
    () => [sequence.start, ...sequence.steps.map((step) => step.matrix)],
    [sequence],
  );

  // Reset to the start whenever the sequence itself changes (new matrix,
  // new decomposition kind, or navigating to a different lesson step).
  // Compared by content rather than object identity: a caller that recomputes
  // `sequence` from a memoized source can still pass a fresh object each
  // render without this firing spuriously.
  const sequenceKey = JSON.stringify(sequence);
  useEffect(() => {
    setStepIndex(0);
    triggerAnimationFrom(sequence.start, sequence.start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequenceKey]);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === stops.length - 1;
  const totalSteps = sequence.steps.length;

  const goTo = (target: number) => {
    const clamped = Math.max(0, Math.min(stops.length - 1, target));
    if (clamped === stepIndex) return;
    triggerAnimationFrom(stops[stepIndex], stops[clamped]);
    setStepIndex(clamped);
  };

  const handleReplay = () => {
    if (isFirst) return;
    triggerAnimationFrom(stops[stepIndex - 1], stops[stepIndex]);
  };

  // "Step 2 of 3: Scaling along the singular values (Σ)" once under way;
  // an intro line while still sitting at the untransformed start.
  const stepLabel = isFirst
    ? 'Press Next to begin'
    : `Step ${stepIndex} of ${totalSteps}: ${sequence.steps[stepIndex - 1].label}`;

  return (
    <div
      className={`rounded-xl border border-white/10 px-5 py-4 bg-black/50 backdrop-blur-md
                  shadow-2xl flex flex-col gap-3 font-sans w-[min(92vw,360px)] ${className ?? ''}`}
    >
      <p className="text-slate-500 uppercase tracking-widest text-[10px]">{sequence.title}</p>
      <p className="text-slate-200 text-sm min-h-[2.5em]">{stepLabel}</p>

      {/* Progress dots — one per stop, current filled, reached ones lit. */}
      <div className="flex items-center gap-1.5">
        {stops.map((_, i) => (
          <span
            key={i}
            className={
              'h-1.5 flex-1 rounded-full transition-colors ' +
              (i <= stepIndex ? 'bg-blue-500' : 'bg-white/10')
            }
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => goTo(stepIndex - 1)}
          disabled={isFirst}
          className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs
                     hover:text-white hover:border-white/20 transition-colors
                     disabled:opacity-30 disabled:pointer-events-none"
        >
          ← Prev
        </button>

        <button
          onClick={handleReplay}
          disabled={isFirst}
          title="Replay this step"
          className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs
                     hover:text-white hover:border-white/20 transition-colors
                     disabled:opacity-30 disabled:pointer-events-none"
        >
          ⟲ Replay
        </button>

        <button
          onClick={() => goTo(stepIndex + 1)}
          disabled={isLast}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95
                     text-white text-xs font-semibold transition-all
                     disabled:opacity-30 disabled:pointer-events-none disabled:active:scale-100"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
