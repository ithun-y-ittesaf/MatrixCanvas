import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Matrix2x2 } from '../math/Matrix2x2';
import { useAppStore } from '../store/appStore';

const SCALE = 60;       // pixels per unit
const GRID_RANGE = 7;   // draw ±7 units

// ── Arrow helper ─────────────────────────────────────────────────────────────
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

  ctx.save();
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
  ctx.restore();
}

// ── Main draw function ────────────────────────────────────────────────────────
function drawScene(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { matrixValues, animProgress } = useAppStore.getState();
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  ctx.clearRect(0, 0, W, H);

  const target = new Matrix2x2(matrixValues);
  const display = Matrix2x2.identity().lerp(target, animProgress);

  // World → canvas (y flipped)
  const tc = (wx: number, wy: number): [number, number] => {
    const [tx, ty] = display.multiply([wx, wy]);
    return [cx + tx * SCALE, cy - ty * SCALE];
  };

  // ── Original (identity) grid — very faint ───────────────────────────────
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * SCALE, cy - GRID_RANGE * SCALE);
    ctx.lineTo(cx + i * SCALE, cy + GRID_RANGE * SCALE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - GRID_RANGE * SCALE, cy + i * SCALE);
    ctx.lineTo(cx + GRID_RANGE * SCALE, cy + i * SCALE);
    ctx.stroke();
  }
  ctx.restore();

  // ── Transformed grid ────────────────────────────────────────────────────
  ctx.save();

  // Vertical lines (x = integer constant)
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.35)';  // blue
  ctx.lineWidth = 1;
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
    if (i === 0) continue; // drawn as axis later
    ctx.beginPath();
    const [x1, y1] = tc(i, -GRID_RANGE);
    const [x2, y2] = tc(i,  GRID_RANGE);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Horizontal lines (y = integer constant)
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.3)';  // red
  for (let i = -GRID_RANGE; i <= GRID_RANGE; i++) {
    if (i === 0) continue;
    ctx.beginPath();
    const [x1, y1] = tc(-GRID_RANGE, i);
    const [x2, y2] = tc( GRID_RANGE, i);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  // ── Transformed axes ────────────────────────────────────────────────────
  ctx.save();
  ctx.lineWidth = 1.8;

  // x-axis (y=0)
  ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
  ctx.beginPath();
  const [xa1, ya1] = tc(-GRID_RANGE, 0);
  const [xa2, ya2] = tc( GRID_RANGE, 0);
  ctx.moveTo(xa1, ya1);
  ctx.lineTo(xa2, ya2);
  ctx.stroke();

  // y-axis (x=0)
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.75)';
  ctx.beginPath();
  const [xb1, yb1] = tc(0, -GRID_RANGE);
  const [xb2, yb2] = tc(0,  GRID_RANGE);
  ctx.moveTo(xb1, yb1);
  ctx.lineTo(xb2, yb2);
  ctx.stroke();
  ctx.restore();

  // ── Basis vectors ĩ and ĵ ───────────────────────────────────────────────
  const origin: [number, number] = [cx, cy];
  drawArrow(ctx, origin, tc(1, 0), '#f87171', 2.5); // î — red
  drawArrow(ctx, origin, tc(0, 1), '#60a5fa', 2.5); // ĵ — blue

  // ── Basis vector labels ─────────────────────────────────────────────────
  ctx.save();
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillStyle = '#f87171';
  const [ix, iy] = tc(1, 0);
  ctx.fillText('î', ix + 6, iy - 4);

  ctx.fillStyle = '#60a5fa';
  const [jx, jy] = tc(0, 1);
  ctx.fillText('ĵ', jx + 6, jy - 4);
  ctx.restore();

  // ── Origin dot ──────────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TransformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animTrigger = useAppStore((s) => s.animTrigger);
  const setAnimProgress = useAppStore((s) => s.setAnimProgress);

  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    return () => ro.disconnect();
  }, []);

  // RAF render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let rafId: number;

    const loop = () => {
      drawScene(canvas);
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
      onUpdate() { setAnimProgress(obj.t); },
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
