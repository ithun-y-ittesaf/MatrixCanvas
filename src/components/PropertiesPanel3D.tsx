import { useAppStore } from '../store/appStore';
import { Matrix3x3 } from '../math/Matrix3x3';
import { fmt as fmtBase } from '../utils/format';

// The 3x3 counterpart of PropertiesPanel: same rows and styling, with the
// determinant reading as a volume scale and a plain-English note for the
// rank-deficient cases (where space collapses onto a plane, a line or a point).

const DISPLAY_DECIMALS = 6;

function fmt(n: number): string {
  return fmtBase(n, DISPLAY_DECIMALS);
}

function rankNote(rank: number): string | null {
  if (rank === 0) return 'Collapses everything to the origin';
  if (rank === 1) return 'Collapses space onto a line';
  if (rank === 2) return 'Collapses space onto a plane';
  return null;
}

// Compares the largest and smallest singular values (the middle one always
// lies between them).
function singularValueNote(values: [number, number, number]): string | null {
  const largest = values[0];
  const smallest = values[2];
  if (smallest < 1e-6) return null; // rankNote already covers a collapse
  if (largest / smallest < 1 + 1e-3) return 'Scales shapes evenly in every direction';
  if (largest / smallest > 3) return 'Stretches shapes much more in some directions than others';
  return null;
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span className={`font-semibold ${ok ? 'text-success' : 'text-danger'}`}>
      {ok ? 'yes' : 'no'}
    </span>
  );
}

export default function PropertiesPanel3D() {
  const matrixValues = useAppStore((s) => s.matrixValues3d);
  const m = new Matrix3x3(matrixValues);
  const det = m.determinant();
  const eigenvals = m.eigenvalues();
  const singularVals = m.singularValues();
  const rank = m.rank();
  const notes = [rankNote(rank), singularValueNote(singularVals)].filter(
    (n): n is string => n !== null,
  );

  return (
    <div className="text-xs font-mono flex flex-col gap-1.5" style={{ minWidth: 190 }}>
      <div className="flex justify-between gap-6">
        <span className="text-ink-dim" title="Factor by which volumes scale">det</span>
        <span className="text-ink">{fmt(det)}</span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-ink-dim">trace</span>
        <span className="text-ink">{fmt(m.trace())}</span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-ink-dim">rank</span>
        <span className="text-ink">{rank}</span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-ink-dim">eigenvalues</span>
        <span className="text-ink text-right">
          {eigenvals.type === 'real'
            ? eigenvals.values.map(fmt).join(', ')
            : `${fmt(eigenvals.values[0])}, ${fmt(eigenvals.values[1].re)} ± ${fmt(Math.abs(eigenvals.values[1].im))}i`}
        </span>
      </div>

      <div className="flex justify-between gap-6">
        <span className="text-ink-dim">singular values</span>
        <span className="text-ink text-right">{singularVals.map(fmt).join(', ')}</span>
      </div>

      <div className="border-t border-line mt-1 pt-1.5 flex flex-col gap-1.5">
        <div className="flex justify-between gap-6">
          <span className="text-ink-dim">invertible</span>
          <Dot ok={m.isInvertible()} />
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-ink-dim">orthogonal</span>
          <Dot ok={m.isOrthogonal()} />
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-ink-dim">symmetric</span>
          <Dot ok={m.isSymmetric()} />
        </div>
      </div>

      {(det < 0 || notes.length > 0) && (
        <div className="border-t border-line mt-0.5 pt-1.5 flex flex-col gap-1">
          {det < 0 && <p className="text-warn/80 text-[10px] font-sans">Orientation reversed</p>}
          {notes.map((n) => (
            <p key={n} className="text-warn/80 text-[10px] font-sans">{n}</p>
          ))}
        </div>
      )}
    </div>
  );
}
