import { useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import gsap from 'gsap';
import { Matrix2x2 } from '../math/Matrix2x2';
import { useAppStore } from '../store/appStore';
import { COLOR_BASIS_X, COLOR_BASIS_Y } from '../theme';
import { fmt } from '../utils/format';
import { polygonArea, pointInPolygon } from '../utils/geometry';

// Pixels per world unit at 100% zoom, and the range pinch/scroll zoom is
// clamped to either side of it.
const DEFAULT_SCALE = 60;
const MIN_SCALE = 15;
const MAX_SCALE = 400;
// Pointer-to-tip distance (px) within which a vector's arrowhead counts as
// "grabbed" for dragging or double-click delete.
const HIT_RADIUS = 12;

function clampScale(s: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

// How many grid lines to draw on each side of the origin so the identity
// grid (and the transformed one, which can reach further out when the
// matrix stretches space) still comfortably fills the canvas at the
// current zoom — shrinks as you zoom in, grows as you zoom out, rather
// than the fixed range a static SCALE could get away with.
function gridRangeFor(width: number, height: number, scale: number): number {
  const visibleHalfExtent = (Math.max(width, height) / 2) / scale;
  return Math.max(6, Math.ceil(visibleHalfExtent * 1.6) + 2);
}

// The same identity->target interpolation drawScene uses, factored out so
// the drag/hit-test handlers below can convert between screen and world
// space exactly the way the current frame was drawn.
function computeDisplay(matrixValues: Matrix2x2['values'], animProgress: number): Matrix2x2 {
  const target = new Matrix2x2(matrixValues);
  return Matrix2x2.identity().interpolateDecomposed(target, animProgress);
}

function worldToScreen(wx: number, wy: number, cx: number, cy: number, scale: number): [number, number] {
  return [cx + wx * scale, cy - wy * scale];
}

// Undoes only the cx/cy/scale part of the mapping — the result is a point
// in *display* space (i.e. already run through the current matrix), not
// the original vector/vertex space. Multiplying by display.inverse() is
// what recovers the original.
function screenToDisplaySpace(px: number, py: number, cx: number, cy: number, scale: number): [number, number] {
  return [(px - cx) / scale, -(py - cy) / scale];
}

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
  // save()/restore() snapshot the entire canvas state (transform, clip, every
  // style) just to toggle the dash pattern — with a scene full of vectors and
  // shapes that's called once per object, every frame. Set + reset the one
  // property we touch instead; it's the same visual result for far less work.
  ctx.setLineDash([5, 4]);
  drawArrow(ctx, from, to, color, 1.5);
  ctx.setLineDash([]);
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
  // See drawDashedArrow above — explicit reset instead of save()/restore().
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  polygonPath(ctx, points);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawFilledPolygon(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  color: string,
) {
  // No save()/restore() needed here — globalAlpha is already reset to 1
  // below, so nothing from this call leaks into the next draw.
  polygonPath(ctx, points);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawScene(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  drawingShapeId: string | null,
  scale: number,
): Record<string, number> {
  const { matrixValues, animProgress, customVectors, shapes } = useAppStore.getState();
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const GRID_RANGE = gridRangeFor(W, H, scale);

  ctx.clearRect(0, 0, W, H);

  const display = computeDisplay(matrixValues, animProgress);

  const tc = (wx: number, wy: number): [number, number] => {
    const [tx, ty] = display.multiply([wx, wy]);
    return worldToScreen(tx, ty, cx, cy, scale);
  };

  // Identity grid — batch all lines into one path
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
    ctx.moveTo(cx + i * scale, cy - GRID_RANGE * scale);
    ctx.lineTo(cx + i * scale, cy + GRID_RANGE * scale);
    ctx.moveTo(cx - GRID_RANGE * scale, cy + i * scale);
    ctx.lineTo(cx + GRID_RANGE * scale, cy + i * scale);
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
  drawArrow(ctx, origin, tc(1, 0), COLOR_BASIS_X, 2.5);
  drawArrow(ctx, origin, tc(0, 1), COLOR_BASIS_Y, 2.5);

  // Labels
  ctx.font = '600 13px Inter, sans-serif';
  ctx.fillStyle = COLOR_BASIS_X;
  const [ix, iy] = tc(1, 0);
  ctx.fillText('î', ix + 6, iy - 4);

  ctx.fillStyle = COLOR_BASIS_Y;
  const [jx, jy] = tc(0, 1);
  ctx.fillText('ĵ', jx + 6, jy - 4);

  // Shapes — faint dashed ghost outline at original vertices, solid filled
  // polygon at transformed vertices. Drawn before vectors so a shape's fill
  // never washes out a vector arrow sitting on top of it.
  const shapeAreas: Record<string, number> = {};
  // Same font for every shape's area label — set once rather than once per
  // shape (this loop can run over dozens of shapes every animation frame).
  ctx.font = '12px Inter, sans-serif';
  for (const shape of shapes) {
    const isDrawing = shape.id === drawingShapeId;
    if (shape.vertices.length === 0) continue;

    const originalPoints = shape.vertices.map(
      ([x, y]): [number, number] => [cx + x * scale, cy - y * scale],
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
      ([tx, ty]): [number, number] => [cx + tx * scale, cy - ty * scale],
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

    ctx.fillStyle = shape.color;
    ctx.fillText(`Area: ${area.toFixed(2)}`, centroid[0] - 20, centroid[1]);
  }

  // Custom vectors — faint dashed ghost at original position, solid arrow at
  // transformed position. Drawn after shapes so arrows stay crisp on top.
  // Same font for every vector's coordinate label — set once, not per vector.
  ctx.font = '12px Inter, sans-serif';
  for (const v of customVectors) {
    const originalPoint: [number, number] = [cx + v.x * scale, cy - v.y * scale];
    drawDashedArrow(ctx, origin, originalPoint, 'rgba(255,255,255,0.25)');

    const transformedPoint = tc(v.x, v.y);
    drawArrow(ctx, origin, transformedPoint, v.color, 2.2);

    ctx.fillStyle = v.color;
    const [tx, ty] = display.multiply([v.x, v.y]);
    ctx.fillText(
      `(${fmt(tx, 2)}, ${fmt(ty, 2)})`,
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

// What's being dragged (if anything) — captured once on pointerdown so
// every subsequent pointermove is a pure function of "where's the pointer
// now" rather than accumulating small per-frame deltas (which would drift).
// invDisplay is null when the current matrix isn't invertible (det≈0); the
// drag then just no-ops rather than dividing by zero into NaN/Infinity.
type DragState =
  | { kind: 'vector'; id: string; invDisplay: Matrix2x2 | null }
  | {
      kind: 'shape'; id: string; invDisplay: Matrix2x2 | null;
      startVertices: [number, number][]; startWorldOriginal: [number, number];
    }
  | null;

interface TransformCanvasProps {
  // Shape id currently being built via click-to-add-vertex; null when not drawing.
  drawingShapeId?: string | null;
  onDrawingShapeIdChange?: (id: string | null) => void;
  onZoomChange?: (percent: number) => void;
}

export default function TransformCanvas({
  drawingShapeId = null, onDrawingShapeIdChange, onZoomChange,
}: TransformCanvasProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef       = useRef<CanvasRenderingContext2D | null>(null);
  const dirtyRef     = useRef(true);
  // Shape id -> transformed area, refreshed every redraw for future UI to read
  const shapeAreasRef = useRef<Record<string, number>>({});
  // Kept in sync with the drawingShapeId prop so the RAF loop and the
  // wheel/touch effect (both mounted once, with an empty dep array) always
  // read the latest value.
  const drawingShapeIdRef = useRef(drawingShapeId);
  drawingShapeIdRef.current = drawingShapeId;

  // Pixels-per-world-unit. Lives in a ref (read every RAF tick, same as
  // matrixValues/customVectors/shapes via the store) rather than state, so
  // a zoom gesture doesn't re-render the component on every wheel/touch
  // event — only onZoomChange, for the badge PlaygroundPage renders.
  const scaleRef = useRef(DEFAULT_SCALE);
  const draggingRef = useRef<DragState>(null);

  const activePlacedCount = useAppStore(
    (s) => s.shapes.find((sh) => sh.id === drawingShapeId)?.vertices.length ?? 0,
  );

  const animTrigger    = useAppStore((s) => s.animTrigger);
  const setAnimProgress = useAppStore((s) => s.setAnimProgress);
  const isScrubbing    = useAppStore((s) => s.isScrubbing);
  const tweenRef       = useRef<gsap.core.Tween | null>(null);

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

  // Also mark dirty when the drawing session itself starts/stops, since
  // that can change what's on canvas (e.g. finishing) without a store
  // update, and reset the cursor to match (grab/drag only apply outside
  // drawing mode).
  useEffect(() => {
    dirtyRef.current = true;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = drawingShapeId ? 'crosshair' : 'default';
    }
  }, [drawingShapeId]);

  // RAF loop — only redraws when dirty
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId: number;

    const loop = () => {
      if (dirtyRef.current && ctxRef.current) {
        shapeAreasRef.current = drawScene(canvas, ctxRef.current, drawingShapeIdRef.current, scaleRef.current);
        dirtyRef.current = false;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Pinch-to-zoom (trackpad pinch surfaces as a ctrl/meta-modified wheel
  // event in every browser; plain scroll/two-finger-swipe zooms the same
  // way, matching Desmos/GeoGebra) and touchscreen two-finger pinch, plus
  // double-click: deletes whatever vector/shape is under the cursor, or
  // resets zoom if nothing is. Native listeners with `{ passive: false }`
  // rather than React's onWheel/onTouch* — those are passive by default for
  // these event types, so preventDefault (needed to stop the page itself
  // from scrolling/zooming) would be a silently-ignored no-op.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const applyScale = (next: number) => {
      scaleRef.current = clampScale(next);
      dirtyRef.current = true;
      onZoomChange?.(Math.round((scaleRef.current / DEFAULT_SCALE) * 100));
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Exponential falloff so the same physical scroll distance feels like
      // the same relative zoom step whether you're zoomed in or out.
      applyScale(scaleRef.current * Math.exp(-e.deltaY * 0.0015));
    };

    const touchDist = (touches: TouchList) => {
      const [a, b] = [touches[0], touches[1]];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };

    let pinchStartDist: number | null = null;
    let pinchStartScale = DEFAULT_SCALE;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartDist = touchDist(e.touches);
        pinchStartScale = scaleRef.current;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDist) {
        e.preventDefault();
        applyScale(pinchStartScale * (touchDist(e.touches) / pinchStartDist));
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchStartDist = null;
    };

    const handleDoubleClick = (e: MouseEvent) => {
      if (!drawingShapeIdRef.current && !useAppStore.getState().activeLesson) {
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const scale = scaleRef.current;
        const { matrixValues, animProgress, customVectors, shapes } = useAppStore.getState();
        const display = computeDisplay(matrixValues, animProgress);

        for (let i = customVectors.length - 1; i >= 0; i--) {
          const v = customVectors[i];
          const [sx, sy] = worldToScreen(...display.multiply([v.x, v.y]), cx, cy, scale);
          if (Math.hypot(sx - px, sy - py) < HIT_RADIUS) {
            useAppStore.getState().removeVector(v.id);
            return;
          }
        }
        for (let i = shapes.length - 1; i >= 0; i--) {
          const s = shapes[i];
          if (s.vertices.length < 3) continue;
          const pts = s.vertices.map(([x, y]): [number, number] => {
            const [wx, wy] = display.multiply([x, y]);
            return worldToScreen(wx, wy, cx, cy, scale);
          });
          if (pointInPolygon([px, py], pts)) {
            useAppStore.getState().removeShape(s.id);
            return;
          }
        }
      }
      // Nothing under the cursor to delete — the standard, expected escape
      // hatch once zoom is a thing at all.
      applyScale(DEFAULT_SCALE);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('dblclick', handleDoubleClick);
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [onZoomChange]);

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
    tweenRef.current = tween;
    return () => { tween.kill(); };
  }, [animTrigger, setAnimProgress]);

  // Manually scrubbing the slider should win over any in-flight tween —
  // kill it the moment scrubbing starts so the two stop fighting over
  // animProgress. (triggerAnimation clears isScrubbing on its side, so a
  // fresh Animate click still starts a clean tween afterwards.)
  useEffect(() => {
    if (isScrubbing) tweenRef.current?.kill();
  }, [isScrubbing]);

  // Click-to-add-vertex while a polygon is being drawn. Converts the click's
  // pixel position back to grid/world space by inverting the same cx/cy/scale
  // mapping used to draw the identity grid and shape ghost outlines above.
  const handleCanvasClick = (e: ReactMouseEvent<HTMLCanvasElement>) => {
    if (!drawingShapeId) return;
    // Defensive: a lesson starting mid-draw resets drawingShapeId one render
    // later (see PlaygroundPage), so guard against the one-frame window
    // where a click could still land here while a lesson is active.
    if (useAppStore.getState().activeLesson) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const wx = (px - cx) / scaleRef.current;
    const wy = -(py - cy) / scaleRef.current;
    useAppStore.getState().addPolygonVertex(drawingShapeId, [wx, wy]);
  };

  // Drag-to-move for existing vectors/shapes (not while drawing a polygon,
  // and not during a lesson — same lock as everything else free-play).
  // Grabs whichever's arrowhead/outline is under the pointer, computed
  // against the *display* matrix so the hit-test matches what's actually
  // drawn on screen this frame.
  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (drawingShapeId || useAppStore.getState().activeLesson) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = scaleRef.current;
    const { matrixValues, animProgress, customVectors, shapes } = useAppStore.getState();
    const display = computeDisplay(matrixValues, animProgress);
    const invDisplay = display.inverse();

    // Reverse order — later items draw on top, so they should win a hit
    // against an earlier, now-covered one.
    for (let i = customVectors.length - 1; i >= 0; i--) {
      const v = customVectors[i];
      const [sx, sy] = worldToScreen(...display.multiply([v.x, v.y]), cx, cy, scale);
      if (Math.hypot(sx - px, sy - py) < HIT_RADIUS) {
        draggingRef.current = { kind: 'vector', id: v.id, invDisplay };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        return;
      }
    }
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (s.vertices.length < 3) continue;
      const pts = s.vertices.map(([x, y]): [number, number] => {
        const [wx, wy] = display.multiply([x, y]);
        return worldToScreen(wx, wy, cx, cy, scale);
      });
      if (pointInPolygon([px, py], pts)) {
        const startWorldOriginal = invDisplay
          ? invDisplay.multiply(screenToDisplaySpace(px, py, cx, cy, scale))
          : screenToDisplaySpace(px, py, cx, cy, scale);
        draggingRef.current = {
          kind: 'shape',
          id: s.id,
          invDisplay,
          startVertices: s.vertices.map(([x, y]): [number, number] => [x, y]),
          startWorldOriginal,
        };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
        return;
      }
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = scaleRef.current;

    const drag = draggingRef.current;
    if (drag) {
      if (!drag.invDisplay) return; // matrix isn't invertible right now — no-op rather than NaN
      const [ox, oy] = drag.invDisplay.multiply(screenToDisplaySpace(px, py, cx, cy, scale));
      if (drag.kind === 'vector') {
        useAppStore.getState().updateVector(drag.id, ox, oy);
      } else {
        const dx = ox - drag.startWorldOriginal[0];
        const dy = oy - drag.startWorldOriginal[1];
        useAppStore.getState().setShapeVertices(
          drag.id,
          drag.startVertices.map(([x, y]): [number, number] => [x + dx, y + dy]),
        );
      }
      return;
    }

    // Not dragging — just update the hover cursor so a draggable item
    // reads as grabbable before you commit to a drag.
    if (drawingShapeId || useAppStore.getState().activeLesson) return;
    const { matrixValues, animProgress, customVectors, shapes } = useAppStore.getState();
    const display = computeDisplay(matrixValues, animProgress);
    let hovering = customVectors.some((v) => {
      const [sx, sy] = worldToScreen(...display.multiply([v.x, v.y]), cx, cy, scale);
      return Math.hypot(sx - px, sy - py) < HIT_RADIUS;
    });
    if (!hovering) {
      hovering = shapes.some((s) => {
        if (s.vertices.length < 3) return false;
        const pts = s.vertices.map(([x, y]): [number, number] => {
          const [wx, wy] = display.multiply([x, y]);
          return worldToScreen(wx, wy, cx, cy, scale);
        });
        return pointInPolygon([px, py], pts);
      });
    }
    canvas.style.cursor = hovering ? 'grab' : 'default';
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.cursor = drawingShapeId ? 'crosshair' : 'default';
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };

  const handleFinishDrawing = () => {
    if (!drawingShapeId) return;
    const shape = useAppStore.getState().shapes.find((s) => s.id === drawingShapeId);
    if (shape && shape.vertices.length < 3) useAppStore.getState().removeShape(drawingShapeId);
    onDrawingShapeIdChange?.(null);
  };
  const handleCancelDrawing = () => {
    if (!drawingShapeId) return;
    useAppStore.getState().removeShape(drawingShapeId);
    onDrawingShapeIdChange?.(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="block w-full h-full"
        style={{ background: 'var(--color-bg)' }}
      />

      {/* Drawing-mode hint + Finish/Cancel — the sidebar that used to host
          these controls is gone outside a lesson (see AddMenu/LessonDock),
          so they live right here next to the thing they control. */}
      {drawingShapeId && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 bg-surface/80 backdrop-blur-sm
                     border border-line rounded-lg px-3 py-2 text-xs font-sans
                     flex items-center gap-3"
        >
          <span className="text-ink-dim whitespace-nowrap">
            Click to add vertices ({activePlacedCount} placed, 3 min)
          </span>
          <button
            onClick={handleFinishDrawing}
            className="px-2.5 py-1 rounded-md bg-success/90 hover:bg-success active:scale-95
                       text-[#062314] font-medium transition-all"
          >
            Finish
          </button>
          <button
            onClick={handleCancelDrawing}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-danger/80 active:scale-95
                       text-ink transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
