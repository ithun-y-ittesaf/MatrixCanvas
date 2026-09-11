import { useEffect, useRef, useState } from 'react';
import {
  useAppStore,
  rectanglePresetVertices,
  trianglePresetVertices,
} from '../store/appStore';
import {
  PlusIcon, VectorIcon, RectangleIcon, TriangleIcon, PolygonIcon,
} from './icons';

interface AddMenuProps {
  drawingShapeId: string | null;
  onDrawingShapeIdChange: (id: string | null) => void;
  // Reports the new vector's id so VectorPopups knows which one to
  // start blank + focused.
  onVectorAdded: (id: string) => void;
}

// The "+" button — floats next to CanvasLegend rather than living in a
// persistent sidebar. Adding a vector opens its own small floating popup
// (VectorPopups); adding a shape drops it straight onto the canvas.
export default function AddMenu({ drawingShapeId, onDrawingShapeIdChange, onVectorAdded }: AddMenuProps) {
  const addVector = useAppStore((s) => s.addVector);
  const addShape = useAppStore((s) => s.addShape);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddVector = () => {
    // The zero vector, not (1, 1) — geometrically "nothing yet" (no arrow
    // is even drawn for it — see drawArrow's length guard), matching the
    // blank inputs its popup starts with until the user types real values.
    addVector(0, 0);
    const latest = useAppStore.getState().customVectors;
    onVectorAdded(latest[latest.length - 1].id);
    setOpen(false);
  };
  const handleAddRectangle = () => {
    addShape('rectangle', rectanglePresetVertices());
    setOpen(false);
  };
  const handleAddTriangle = () => {
    addShape('triangle', trianglePresetVertices());
    setOpen(false);
  };
  const handleStartDrawing = () => {
    addShape('polygon', []);
    const latest = useAppStore.getState().shapes;
    onDrawingShapeIdChange(latest[latest.length - 1].id);
    setOpen(false);
  };

  return (
    <div ref={menuRef} className="relative shrink-0 font-sans">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Add vector or shape"
        className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent
                   hover:bg-accent-strong active:scale-90 text-white transition-all shadow-lg"
      >
        <PlusIcon className="w-4 h-4" />
      </button>

      <div
        className={`absolute top-full left-0 mt-1 w-48 rounded-lg bg-surface-raised border border-line
                    overflow-hidden z-20 shadow-xl transition-all duration-150 ease-out origin-top-left
                    ${open
                      ? 'opacity-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 -translate-y-1 pointer-events-none'}`}
      >
        <button
          onClick={handleAddVector}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-dim hover:bg-white/5 hover:text-ink transition-colors"
        >
          <VectorIcon className="w-4 h-4 shrink-0" />
          Add Vector
        </button>
        <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest text-ink-faint">
          Add Shape
        </p>
        <button
          onClick={handleAddRectangle}
          className="w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm text-ink-dim hover:bg-white/5 hover:text-ink transition-colors"
        >
          <RectangleIcon className="w-4 h-4 shrink-0" />
          Rectangle
        </button>
        <button
          onClick={handleAddTriangle}
          className="w-full flex items-center gap-2 pl-6 pr-3 py-1.5 text-sm text-ink-dim hover:bg-white/5 hover:text-ink transition-colors"
        >
          <TriangleIcon className="w-4 h-4 shrink-0" />
          Triangle
        </button>
        <button
          onClick={handleStartDrawing}
          disabled={!!drawingShapeId}
          className="w-full flex items-center gap-2 pl-6 pr-3 py-1.5 mb-1 text-sm text-ink-dim hover:bg-white/5 hover:text-ink transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          <PolygonIcon className="w-4 h-4 shrink-0" />
          Polygon
        </button>
      </div>
    </div>
  );
}
