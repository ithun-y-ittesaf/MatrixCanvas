import { useAppStore } from '../store/appStore';
import { Matrix2x2 } from '../math/Matrix2x2';
import MatrixBracket from './MatrixBracket';
import VectorBracket from './VectorBracket';
import { fmt } from '../utils/format';
import { katexHtml } from '../utils/katexHtml';
import { seqLabel } from '../utils/labels';

// Always-visible strip mirroring the canvas as a live, editable equation:
// the matrix bracket alone when there's nothing to multiply yet ("at
// identity, just show the matrix"), or M followed by one Mv = v' chip per
// vector — each vector's bracket is the same VectorBracket its own floating
// popup uses, so editing either place updates the same store value live.
// No collapse toggle: this and the scrub bar below it are the two things
// that stay usable even while a lesson has everything else locked.
export default function EquationPanel() {
  const matrixValues = useAppStore((s) => s.matrixValues);
  const customVectors = useAppStore((s) => s.customVectors);
  const m = new Matrix2x2(matrixValues);

  return (
    <div
      className="rounded-xl border border-line bg-surface/70 backdrop-blur-md shadow-2xl
                 px-4 py-3 flex items-center gap-4 overflow-x-auto max-w-[min(90vw,720px)] font-sans"
    >
      <MatrixBracket />

      {customVectors.map((v) => {
        const [tx, ty] = m.multiply([v.x, v.y]);
        return (
          <div key={v.id} className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs font-semibold rounded px-1.5 py-0.5 shrink-0"
              style={{ color: v.color, background: `${v.color}22` }}
            >
              {seqLabel(v.seq)}
            </span>
            <VectorBracket id={v.id} x={v.x} y={v.y} color={v.color} />
            <span className="text-ink-faint text-lg">=</span>
            <span
              className="text-[15px]"
              style={{ color: v.color }}
              dangerouslySetInnerHTML={katexHtml(`\\begin{bmatrix}${fmt(tx, 2)} \\\\ ${fmt(ty, 2)}\\end{bmatrix}`)}
            />
          </div>
        );
      })}
    </div>
  );
}
