import { useAppStore } from '../store/appStore';
import { Matrix2x2 } from '../math/Matrix2x2';

function fmt(n: number): string {
  return parseFloat(n.toFixed(4)).toString();
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span className={`font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
      {ok ? 'yes' : 'no'}
    </span>
  );
}

export default function PropertiesPanel() {
  const matrixValues = useAppStore((s) => s.matrixValues);
  const m = new Matrix2x2(matrixValues);
  const det = m.determinant();
  const eigenvals = m.eigenvalues();

  return (
    <div
      className="rounded-xl border border-white/10 px-4 py-3 text-xs font-mono
                 bg-black/50 backdrop-blur-md flex flex-col gap-1.5"
      style={{ minWidth: 190 }}
    >
      <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-0.5 font-sans">
        Properties
      </p>

      <div className="flex justify-between gap-6">
        <span className="text-slate-400">det</span>
        <span className="text-white">{fmt(det)}</span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-slate-400">trace</span>
        <span className="text-white">{fmt(m.trace())}</span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-slate-400">rank</span>
        <span className="text-white">{m.rank()}</span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-slate-400">eigenvalues</span>
        <span className="text-white">
          {eigenvals
            ? `${fmt(eigenvals[0])}, ${fmt(eigenvals[1])}`
            : <span className="text-slate-500 italic">ℂ</span>}
        </span>
      </div>

      <div className="border-t border-white/5 mt-1 pt-1.5 flex flex-col gap-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">invertible</span>
          <Dot ok={m.isInvertible()} />
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">orthogonal</span>
          <Dot ok={m.isOrthogonal()} />
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">symmetric</span>
          <Dot ok={m.isSymmetric()} />
        </div>
      </div>

      {det < 0 && (
        <p className="text-amber-500/80 text-[10px] font-sans mt-0.5 border-t border-white/5 pt-1.5">
          Orientation reversed
        </p>
      )}
    </div>
  );
}
