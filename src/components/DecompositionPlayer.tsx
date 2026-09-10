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

  return (
    <div className={className}>
      <button onClick={() => goTo(stepIndex - 1)} disabled={isFirst}>
        Prev
      </button>
      <button onClick={handleReplay} disabled={isFirst}>
        Replay
      </button>
      <button onClick={() => goTo(stepIndex + 1)} disabled={isLast}>
        Next
      </button>
    </div>
  );
}
