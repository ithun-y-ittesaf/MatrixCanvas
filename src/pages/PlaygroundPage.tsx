import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MatrixInput from '../components/MatrixInput';
import PropertiesPanel from '../components/PropertiesPanel';
import ShapePanel from '../components/ShapePanel';
import TransformCanvas from '../components/TransformCanvas';
import VectorPanel from '../components/VectorPanel';
import { useAppStore } from '../store/appStore';
import { buildSearchParams, hydrateStoreFromSearchParams } from '../utils/urlState';

const URL_SYNC_DEBOUNCE_MS = 400;

export default function PlaygroundPage() {
  // Lifted so TransformCanvas (click-to-add-vertex) and ShapePanel
  // (start/finish controls) share the same in-progress polygon.
  const [drawingShapeId, setDrawingShapeId] = useState<string | null>(null);

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
  // so typing in MatrixInput or dragging out a polygon doesn't spam history
  // entries — and written with `replace: true` so each update overwrites the
  // current history entry rather than pushing a new one. Skips the run that
  // fires right after mount so loading a shared link (or a bare "/") doesn't
  // immediately rewrite the URL back at itself.
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
    <div className="relative h-[calc(100vh-3.5rem)]">
      {/* Full-bleed canvas */}
      <TransformCanvas drawingShapeId={drawingShapeId} />

      {/* Floating matrix panel — bottom-left */}
      <div className="absolute bottom-6 left-6 rounded-xl border border-white/10 px-5 py-4
                      bg-black/50 backdrop-blur-md shadow-2xl">
        <MatrixInput />
      </div>

      {/* Vector panel — top-left */}
      <div className="absolute top-6 left-6">
        <VectorPanel />
      </div>

      {/* Shape panel — top-right, below the canvas's basis-vector legend */}
      <div className="absolute top-24 right-6">
        <ShapePanel
          drawingShapeId={drawingShapeId}
          onDrawingShapeIdChange={setDrawingShapeId}
        />
      </div>

      {/* Properties legend — bottom-right */}
      <div className="absolute bottom-6 right-6">
        <PropertiesPanel />
      </div>
    </div>
  );
}
