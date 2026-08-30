import { useAppStore } from '../store/appStore';
import { Matrix2x2 } from '../math/Matrix2x2';

// NFR-5 requires displayed numbers to be accurate to at least 6 decimal
// places. toFixed(4) was truncating below that; round/display to 6 instead
// (trailing zeros are still trimmed for readability).
const DISPLAY_DECIMALS = 6;

function fmt(n: number): string {
  return parseFloat(n.toFixed(DISPLAY_DECIMALS)).toString();
}

// One-line plain-English read of what the singular values imply about the
// transform, in the same spirit as the "Orientation reversed" note below.
// Only surfaces when there's something notable to say - a near-uniform mix
// of the two doesn't get a note.
function singularValueNote([s1, s2]: [number, number]): string | null {
  const eps = 1e-6;
  if (s1 < eps) return 'Collapses everything to the origin';
  if (s2 < eps) return 'Collapses space onto a line';
  const ratio = s1 / s2;
  if (ratio < 1 + 1e-3) return 'Scales shapes evenly in every direction';
  if (ratio > 3) return 'Stretches shapes much more in one direction than the other';
  return null;
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
  const singularVals = m.singularValues();
  const singularNote = singularValueNote(singularVals);

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
          {eigenvals.type === 'real'
            ? `${fmt(eigenvals.values[0])}, ${fmt(eigenvals.values[1])}`
            : `${fmt(eigenvals.values[0].re)} ± ${fmt(Math.abs(eigenvals.values[0].im))}i`}
        </span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-slate-400">singular values</span>
        <span className="text-white">
          {fmt(singularVals[0])}, {fmt(singularVals[1])}
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

      {(det < 0 || singularNote) && (
        <div className="border-t border-white/5 mt-0.5 pt-1.5 flex flex-col gap-1">
          {det < 0 && (
            <p className="text-amber-500/80 text-[10px] font-sans">Orientation reversed</p>
          )}
          {singularNote && (
            <p className="text-amber-500/80 text-[10px] font-sans">{singularNote}</p>
          )}
        </div>
      )}
    </div>
  );
}
