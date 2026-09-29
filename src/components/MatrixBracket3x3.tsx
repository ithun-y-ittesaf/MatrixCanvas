import { useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useKatexOverlay } from '../utils/useKatexOverlay';
import type { Matrix3x3Values } from '../math/Matrix3x3';

// The 3x3 counterpart of MatrixBracket: one real `\begin{bmatrix}` KaTeX
// expression with a transparent, precisely-positioned <input> over each cell
// (see useKatexOverlay). Read MatrixBracket for the reasoning behind the
// lastKnown/raw split - it is identical here, just over nine cells.

function toRaw(v: number): string {
  return parseFloat(v.toFixed(6)).toString();
}

type Raw = [[string, string, string], [string, string, string], [string, string, string]];

function fromStore(vals: Matrix3x3Values): Raw {
  return vals.map((row) => row.map(toRaw)) as Raw;
}

function sameValues(a: Matrix3x3Values, b: Matrix3x3Values): boolean {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

const CELL_IDS = [
  'mb3_00', 'mb3_01', 'mb3_02',
  'mb3_10', 'mb3_11', 'mb3_12',
  'mb3_20', 'mb3_21', 'mb3_22',
] as const;
const FONT_PX = 21;
const PAD = 4;
const INDEXES = [0, 1, 2] as const;

export default function MatrixBracket3x3() {
  const matrixValues = useAppStore((s) => s.matrixValues3d);
  const setMatrixValue = useAppStore((s) => s.setMatrixValue3d);
  const [raw, setRaw] = useState<Raw>(() => fromStore(matrixValues));

  const [lastKnown, setLastKnown] = useState<Matrix3x3Values>(matrixValues);
  if (!sameValues(lastKnown, matrixValues)) {
    setLastKnown(matrixValues);
    setRaw(fromStore(matrixValues));
  }

  const cellTex = (r: number, c: number) => {
    const v = raw[r][c];
    return `\\htmlId{${CELL_IDS[r * 3 + c]}}{${v === '' ? '\\phantom{0}' : v}}`;
  };
  const tex =
    `\\begin{bmatrix}` +
    INDEXES.map((r) => INDEXES.map((c) => cellTex(r, c)).join(' & ')).join(' \\\\ ') +
    `\\end{bmatrix}`;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const { containerRef, rects } = useKatexOverlay(tex, CELL_IDS, anchorRef);

  const handleChange = (r: 0 | 1 | 2, c: 0 | 1 | 2, val: string) => {
    setRaw((prev) => {
      const next = prev.map((row) => [...row]) as Raw;
      next[r][c] = val;
      return next;
    });
    const n = parseFloat(val);
    if (!isNaN(n)) {
      const next = matrixValues.map((row) => [...row]) as Matrix3x3Values;
      next[r][c] = n;
      setLastKnown(next);
      setMatrixValue(r, c, n);
    }
  };

  return (
    <span ref={anchorRef} className="relative inline-block select-none" style={{ fontSize: FONT_PX, lineHeight: 1 }}>
      <span ref={containerRef} className="text-ink inline-block align-top" />
      {INDEXES.map((r) =>
        INDEXES.map((c) => {
          const id = CELL_IDS[r * 3 + c];
          const rect = rects[id];
          if (!rect) return null;
          return (
            <input
              key={id}
              type="text"
              inputMode="decimal"
              aria-label={`Matrix cell row ${r + 1}, column ${c + 1}`}
              value={raw[r][c]}
              onFocus={(e) => e.target.select()}
              onChange={(e) => handleChange(r, c, e.target.value)}
              className="katex-overlay-input absolute bg-transparent text-transparent caret-ink focus:outline-none"
              style={{
                left: rect.left - PAD,
                top: rect.top - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
              }}
            />
          );
        })
      )}
    </span>
  );
}
