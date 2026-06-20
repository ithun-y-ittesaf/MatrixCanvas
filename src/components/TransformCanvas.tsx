import { useEffect, useRef } from 'react';
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

function drawScene(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const { matrixValues, animProgress } = useAppStore.getState();
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

  // Origin dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

export default function TransformCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef       = useRef<CanvasRenderingContext2D | null>(null);
  const dirtyRef     = useRef(true);

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

  // RAF loop — only redraws when dirty
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId: number;

    const loop = () => {
      if (dirtyRef.current && ctxRef.current) {
        drawScene(canvas, ctxRef.current);
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

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ background: '#0d0f1a' }}
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
    </div>
  );
}
