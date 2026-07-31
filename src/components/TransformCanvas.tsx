import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import gsap from 'gsap';
import { Matrix2x2 } from '../math/Matrix2x2';
import { useAppStore } from '../store/appStore';

const SCALE = 60;
const GRID_RANGE = 7;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  color: string,
  width: number,
) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 2) return;

  const angle = Math.atan2(dy, dx);
  const head = Math.min(14, len * 0.35);

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(to[0], to[1]);
  ctx.lineTo(
    to[0] - head * Math.cos(angle - Math.PI / 6),
    to[1] - head * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    to[0] - head * Math.cos(angle + Math.PI / 6),
    to[1] - head * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function drawDashedArrow(
  ctx: CanvasRenderingContext2D,
  from: [number, number],
  to: [number, number],
  color: string,
) {
  ctx.save();
  ctx.setLineDash([5, 4]);
  drawArrow(ctx, from, to, color, 1.5);
  ctx.restore();
}

function polygonPath(ctx: CanvasRenderingContext2D, points: [number, number][]) {
  if (points.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
}

function drawDashedPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
) {
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  polygonPath(ctx, points);
  ctx.stroke();
  ctx.restore();
}

function drawFilledPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
) {
  ctx.save();
  polygonPath(ctx, points);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
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

function drawScene(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  drawingShapeId: string | null,
): Record<string, number> {
  const { matrixValues, animProgress, customVectors, shapes } = useAppStore.getState();
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  ctx.clearRect(0, 0, W, H);

  const target = new Matrix2x2(matrixValues);
  const display = Matrix2x2.identity().lerp(target, animProgress);

  const tc = (wx: number, wy: number): [number, number] => {
    const [tx, ty] = display.multiply([wx, wy]);
    return [cx + tx * SCALE, cy - ty * SCALE];
  };

  // Identity grid — batch all lines into one path
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
    ctx.moveTo(cx + i * SCALE, cy - GRID_RANGE * SCALE);
    ctx.lineTo(cx + i * SCALE, cy + GRID_RANGE * SCALE);
    ctx.moveTo(cx - GRID_RANGE * SCALE, cy + i * SCALE);
    ctx.lineTo(cx + GRID_RANGE * SCALE, cy + i * SCALE);
  }
  ctx.stroke();

  // Transformed vertical grid lines (blue) — one path
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';
  ctx.beginPath();
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
    if (i === 0) continue;
    const [x1, y1] = tc(i, -GRID_RANGE);
    const [x2, y2] = tc(i,  GRID_RANGE);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  // Transformed horizontal grid lines (red) — one path
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';
  ctx.beginPath();
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
    if (i === 0) continue;
    const [x1, y1] = tc(-GRID_RANGE, i);
    const [x2, y2] = tc( GRID_RANGE, i);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();

  // Transformed axes
  ctx.lineWidth = 1.8;

  ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
  ctx.beginPath();
  ctx.moveTo(...tc(-GRID_RANGE, 0));
  ctx.lineTo(...tc( GRID_RANGE, 0));
  ctx.stroke();

  ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)';
  ctx.beginPath();
  ctx.moveTo(...tc(0, -GRID_RANGE));
  ctx.lineTo(...tc(0,  GRID_RANGE));
  ctx.stroke();

  // Basis vectors
  const origin: [number, number] = [cx, cy];
  ctx.lineCap = 'round';
  drawArrow(ctx, origin, tc(1, 0), '#f87171', 2.5);
  drawArrow(ctx, origin, tc(0, 1), '#60a5fa', 2.5);

  // Labels
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillStyle = '#f87171';
  const [ix, iy] = tc(1, 0);
  ctx.fillText('î', ix + 6, iy - 4);

  ctx.fillStyle = '#60a5fa';
  const [jx, jy] = tc(0, 1);
  ctx.fillText('ĵ', jx + 6, jy - 4);

  // Shapes — faint dashed ghost outline at original vertices, solid filled
  // polygon at transformed vertices. Drawn before vectors so a shape's fill
  // never washes out a vector arrow sitting on top of it.
  const shapeAreas: Record<string, number> = {};
  for (const shape of shapes) {
    const isDrawing = shape.id === drawingShapeId;
    if (shape.vertices.length === 0) continue;

    const originalPoints = shape.vertices.map(
      ([x, y]): [number, number] => [cx + x * SCALE, cy - y * SCALE],
    );

    // While the shape is being actively drawn, mark each placed vertex with
    // a dot so a click registers visually even before there are enough
    // points to form a line (2) or a fillable polygon (3).
    if (isDrawing) {
      ctx.fillStyle = shape.color;
      for (const [px, py] of originalPoints) {
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (shape.vertices.length < 2) continue;

    drawDashedPolygon(ctx, originalPoints, 'rgba(255,255,255,0.25)');

    const transformedWorld = shape.vertices.map(
      (v): [number, number] => display.multiply(v),
    );
    const transformedPoints = transformedWorld.map(
      ([tx, ty]): [number, number] => [cx + tx * SCALE, cy - ty * SCALE],
    );
    drawFilledPolygon(ctx, transformedPoints, shape.color);

    const area = polygonArea(transformedWorld);
    shapeAreas[shape.id] = area;

    const centroid = transformedPoints.reduce(
      (acc, [px, py]): [number, number] => [acc[0] + px, acc[1] + py],
      [0, 0] as [number, number],
    );
    centroid[0] /= transformedPoints.length;
    centroid[1] /= transformedPoints.length;

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = shape.color;
    ctx.fillText(`Area: ${area.toFixed(2)}`, centroid[0] - 20, centroid[1]);
  }

  // Custom vectors — faint dashed ghost at original position, solid arrow at
  // transformed position. Drawn after shapes so arrows stay crisp on top.
  for (const v of customVectors) {
    const originalPoint: [number, number] = [cx + v.x * SCALE, cy - v.y * SCALE];
    drawDashedArrow(ctx, origin, originalPoint, 'rgba(255,255,255,0.25)');

    const transformedPoint = tc(v.x, v.y);
    drawArrow(ctx, origin, transformedPoint, v.color, 2.2);

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = v.color;
    const [tx, ty] = display.multiply([v.x, v.y]);
    ctx.fillText(
      `(${parseFloat(tx.toFixed(2))}, ${parseFloat(ty.toFixed(2))})`,
      transformedPoint[0] + 6,
      transformedPoint[1] - 4,
    );
  }

  // Origin dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  return shapeAreas;
}

interface TransformCanvasProps {
  // Shape id currently being built via click-to-add-vertex; null when not drawing.
  drawingShapeId?: string | null;
}

export default function TransformCanvas({ drawingShapeId = null }: TransformCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef       = useRef<CanvasRenderingContext2D | null>(null);
  const dirtyRef     = useRef(true);
  // Shape id -> transformed area, refreshed every redraw for future UI to read
  const shapeAreasRef = useRef<Record<string, number>>({});
  // Kept in sync with the drawingShapeId prop so the RAF loop (mounted once,
  // with an empty dep array) always reads the latest value.
  const drawingShapeIdRef = useRef(drawingShapeId);
  drawingShapeIdRef.current = drawingShapeId;

  const animTrigger    = useAppStore((s) => s.animTrigger);
  const setAnimProgress = useAppStore((s) => s.setAnimProgress);

  // Initialise canvas size + cache context
  useEffect(() => {
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    ctxRef.current = canvas.getContext('2d');

    const resize = () => {
      canvas.width  = container.clientWidth;
      canvas.height = container.clientHeight;
      dirtyRef.current = true;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => ro.disconnect();
  }, []);

  // Mark canvas dirty whenever any store value changes
  useEffect(() => {
    return useAppStore.subscribe(() => {
      dirtyRef.current = true;
    });
  }, []);

  // Also mark dirty when the drawing session itself starts/stops, since that
  // can change what's on canvas (e.g. finishing) without a store update.
  useEffect(() => {
    dirtyRef.current = true;
  }, [drawingShapeId]);

  // RAF loop — only redraws when dirty
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId: number;

    const loop = () => {
      if (dirtyRef.current && ctxRef.current) {
        shapeAreasRef.current = drawScene(canvas, ctxRef.current, drawingShapeIdRef.current);
        dirtyRef.current = false;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // GSAP tween triggered by Animate button
  useEffect(() => {
    if (animTrigger === 0) return;
    const obj = { t: 0 };
    const tween = gsap.to(obj, {
      t: 1,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate()  { setAnimProgress(obj.t); },
      onComplete() { setAnimProgress(1); },
    });
    return () => { tween.kill(); };
  }, [animTrigger, setAnimProgress]);

  // Click-to-add-vertex while a polygon is being drawn. Converts the click's
  // pixel position back to grid/world space by inverting the same cx/cy/SCALE
  // mapping used to draw the identity grid and shape ghost outlines above.
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!drawingShapeId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const wx = (px - cx) / SCALE;
    const wy = -(py - cy) / SCALE;
    useAppStore.getState().addPolygonVertex(drawingShapeId, [wx, wy]);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block w-full h-full"
        style={{ background: '#0d0f1a', cursor: drawingShapeId ? 'crosshair' : 'default' }}
      />

      {/* Legend */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-black/40 backdrop-blur-sm
                      rounded-lg px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#f87171] inline-block rounded" />
          <span className="text-slate-300">î (basis x)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-[#60a5fa] inline-block rounded" />
          <span className="text-slate-300">ĵ (basis y)</span>
        </div>
      </div>

      {/* Drawing-mode hint */}
      {drawingShapeId && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm
                        rounded-lg px-3 py-1.5 text-xs text-slate-200 pointer-events-none">
          Click to add polygon vertices — Finish or Cancel in the Shapes panel
        </div>
      )}
    </div>
  );
}
