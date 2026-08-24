import {
  useAppStore,
  rectanglePresetVertices,
  trianglePresetVertices,
} from '../store/appStore';
import { Matrix2x2 } from '../math/Matrix2x2';

function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

// Shoelace formula — works for any simple polygon, so it covers the
// rectangle and triangle presets as well as freeform custom polygons.
function polygonArea(vertices: [number, number][]): number {
  let sum = 0;
  for (let i = 0; i < vertices.length; i++) {
    const [x1, y1] = vertices[i];
    const [x2, y2] = vertices[(i + 1) % vertices.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

interface ShapePanelProps {
  drawingShapeId: string | null;
  onDrawingShapeIdChange: (id: string | null) => void;
}

export default function ShapePanel({ drawingShapeId, onDrawingShapeIdChange }: ShapePanelProps) {
  const { matrixValues, shapes, addShape, removeShape } = useAppStore();
  const m = new Matrix2x2(matrixValues);

  const handleAddRectangle = () => addShape('rectangle', rectanglePresetVertices());
  const handleAddTriangle = () => addShape('triangle', trianglePresetVertices());

  const handleStartDrawing = () => {
    addShape('polygon', []);
    const latest = useAppStore.getState().shapes;
    onDrawingShapeIdChange(latest[latest.length - 1].id);
  };

  const handleFinishDrawing = () => {
    if (!drawingShapeId) return;
    const shape = useAppStore.getState().shapes.find((s) => s.id === drawingShapeId);
    if (shape && shape.vertices.length < 3) {
      removeShape(drawingShapeId);
    }
    onDrawingShapeIdChange(null);
  };

  const handleCancelDrawing = () => {
    if (!drawingShapeId) return;
    removeShape(drawingShapeId);
    onDrawingShapeIdChange(null);
  };

  const visibleShapes = shapes.filter((s) => s.id !== drawingShapeId);

  return (
    <div
      className="rounded-xl border border-white/10 px-4 py-3 text-xs font-mono
                 bg-black/50 backdrop-blur-md flex flex-col gap-2"
      style={{ minWidth: 220 }}
    >
      <p className="text-slate-500 uppercase tracking-widest text-[10px] font-sans">
        Shapes
      </p>

      <div className="flex items-center gap-1.5 font-sans">
        <button
          onClick={handleAddRectangle}
          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500
                     active:scale-95 text-white transition-all"
        >
          Rectangle
        </button>
        <button
          onClick={handleAddTriangle}
          className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500
                     active:scale-95 text-white transition-all"
        >
          Triangle
        </button>
      </div>

      <div className="font-sans">
        {drawingShapeId ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFinishDrawing}
              className="flex-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500
                         active:scale-95 text-white transition-all"
            >
              Finish shape
            </button>
            <button
              onClick={handleCancelDrawing}
              className="px-2.5 py-1 rounded-md bg-slate-700 hover:bg-red-500/80
                         active:scale-95 text-white transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleStartDrawing}
            className="w-full px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600
                       active:scale-95 text-white transition-all"
          >
            Draw custom polygon
          </button>
        )}
      </div>

      {drawingShapeId && (
        <p className="text-slate-500 text-[10px] font-sans">
          Click on the canvas to add vertices
          {' '}({shapes.find((s) => s.id === drawingShapeId)?.vertices.length ?? 0} placed,{' '}
          3 minimum).
        </p>
      )}

      {visibleShapes.length > 0 && (
        <div className="flex flex-col gap-1 border-t border-white/5 pt-1.5 max-h-40 overflow-y-auto">
          {visibleShapes.map((s) => {
            const originalArea = polygonArea(s.vertices);
            const transformedArea = polygonArea(s.vertices.map((v) => m.multiply(v)));
            return (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span style={{ color: s.color }}>
                  {s.type} · {fmt(originalArea)} → {fmt(transformedArea)}
                </span>
                <button
                  onClick={() => removeShape(s.id)}
                  className="text-slate-500 hover:text-red-400 font-sans transition-colors"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
