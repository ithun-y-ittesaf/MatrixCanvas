import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AddMenu from '../components/AddMenu';
import AnimateScrubBar from '../components/AnimateScrubBar';
import CanvasLegend from '../components/CanvasLegend';
import CanvasToolbar from '../components/CanvasToolbar';
import EquationPanel from '../components/EquationPanel';
import LessonDock from '../components/LessonDock';
import LessonNav from '../components/LessonNav';
import TransformCanvas from '../components/TransformCanvas';
import VectorPopups from '../components/VectorPopups';
import { useAppStore } from '../store/appStore';
import { buildSearchParams, hydrateStoreFromSearchParams } from '../utils/urlState';

const URL_SYNC_DEBOUNCE_MS = 400;

// Applied to the free-play editing controls (add menu, vector popups, the
// [ ]/x² toolbar) while a lesson is active — a lesson is a guided sequence,
// and letting them stay live underneath it would let a click silently undo
// whatever step the lesson just set up. Dimmed + pointer-events-none reads
// as "inert" without fully hiding the state they represent. The equation
// panel + scrub bar are deliberately *not* wrapped in this — they're the
// two things that stay usable so a lesson can still be scrubbed through and
// read as an equation while everything else is locked.
const LOCKABLE_CLASS = 'transition-all duration-300';
const LOCKED_CLASS = 'pointer-events-none opacity-30 saturate-50';

export default function PlaygroundPage() {
  // Lifted so TransformCanvas (click-to-add-vertex, Finish/Cancel) and
  // AddMenu (starts a polygon) share the same in-progress shape.
  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);
  // The vector added most recently this session — its popup starts blank
  // + focused (see VectorPopups/VectorBracket's autoFocusX).
  const [freshVectorId, setFreshVectorId] = useState<string | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);

  const isLessonActive = useAppStore((s) => s.activeLesson !== null);
  const lockable = (extra?: string) =>
    `${LOCKABLE_CLASS} ${isLessonActive ? LOCKED_CLASS : ''} ${extra ?? ''}`;

  // A lesson can start mid-draw (e.g. the user was drawing a polygon, then
  // opened Learn in another tab flow and started a lesson) — drop the
  // in-progress shape so it isn't left half-finished and inaccessible
  // behind the lock, and so canvas clicks have nothing to fall through to.
  useEffect(() => {
    if (isLessonActive) setDrawingShapeId(null);
  }, [isLessonActive]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Hydrate the store from the URL exactly once, synchronously in the render
  // body (guarded by a ref) rather than in an effect. That runs before the
  // panels below are rendered for the first time, so a shared link shows its
  // matrix/vectors/shapes on first paint instead of flashing the default
  // identity matrix and then snapping to the shared state.
  const hydratedRef = useRef(false);
  if (!hydratedRef.current) {
    hydratedRef.current = true;
    hydrateStoreFromSearchParams(searchParams);
  }

  const matrixValues = useAppStore((s) => s.matrixValues);
  const customVectors = useAppStore((s) => s.customVectors);
  const shapes = useAppStore((s) => s.shapes);

  // Mirror matrix/vectors/shapes into the URL as a shareable link, debounced
  // so typing in the matrix bracket or dragging out a polygon doesn't spam
  // history entries — and written with `replace: true` so each update
  // overwrites the current history entry rather than pushing a new one.
  // Skips the run that fires right after mount so loading a shared link (or
  // a bare "/") doesn't immediately rewrite the URL back at itself.
  const skipNextSyncRef = useRef(true);
  useEffect(() => {
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      setSearchParams(buildSearchParams({ matrixValues, customVectors, shapes }), { replace: true });
    }, URL_SYNC_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [matrixValues, customVectors, shapes, setSearchParams]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left dock — renders nothing outside a lesson. */}
      <LessonDock />

      {/* Canvas pane — everything below is positioned relative to this, not
          the full viewport, so it stays clear of the dock. */}
      <div className="relative flex-1 min-w-0">
        <TransformCanvas
          drawingShapeId={drawingShapeId}
          onDrawingShapeIdChange={setDrawingShapeId}
          onZoomChange={setZoomPercent}
        />

        {/* Top-left cluster: legend + add menu, zoom readout, then each
            vector's own floating bracket popup underneath. */}
        <div className={lockable('absolute top-3 left-3 flex flex-col gap-2 z-10')}>
          <div className="flex items-start gap-2">
            <CanvasLegend />
            <AddMenu
              drawingShapeId={drawingShapeId}
              onDrawingShapeIdChange={setDrawingShapeId}
              onVectorAdded={setFreshVectorId}
            />
          </div>

          {zoomPercent !== 100 && (
            <div className="bg-surface/60 backdrop-blur-sm border border-line rounded-lg px-2.5 py-1
                            text-[11px] text-ink-faint font-mono select-none w-fit">
              {zoomPercent}%
            </div>
          )}

          <VectorPopups freshVectorId={freshVectorId} />
        </div>

        {/* Icon rail (share / properties / presets) — top-right */}
        <div className={lockable('absolute top-4 right-4')}>
          <CanvasToolbar />
        </div>

        {/* Bottom-center stack: the live matrix-multiplication equation
            (always editable — never locked, see LOCKABLE_CLASS's comment),
            with the compact Play + scrub bar underneath it. */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          <EquationPanel />
          <AnimateScrubBar />
        </div>

        {/* Prev/next *lesson* (not step — LessonDock's own Prev/Next inside
            LessonRunner handle that) — bottom-right, only during a lesson. */}
        <div className="absolute bottom-6 right-6">
          <LessonNav />
        </div>
      </div>
    </div>
  );
}
