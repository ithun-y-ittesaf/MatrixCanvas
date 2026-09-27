import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import type { Matrix3x3Values } from '../math/Matrix3x3';

function toRaw(v: number): string {
  return parseFloat(v.toFixed(6)).toString();
}

type Raw = [
  [string, string, string],
  [string, string, string],
  [string, string, string],
];

function fromStore(vals: Matrix3x3Values): Raw {
  return vals.map((row) => row.map(toRaw)) as Raw;
}

function sameValues(a: Matrix3x3Values, b: Matrix3x3Values): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

// Plain numeric-grid input for the 3x3 matrix, styled as a bracketed panel —
// the 3D analogue of MatrixBracket's 2x2 editor, minus the KaTeX overlay
// (a 3x3 doesn't need to live inline in an equation the way the 2D matrix
// does). Keeps the same "local raw string, synced from the store but not
// clobbered by its own echo" pattern so a mid-typed value like "1." isn't
// reformatted out from under the user.
export default function Matrix3x3Input() {
  const matrixValues3d = useAppStore((s) => s.matrixValues3d);
  const setMatrixValue3d = useAppStore((s) => s.setMatrixValue3d);
  const [raw, setRaw] = useState<Raw>(() => fromStore(matrixValues3d));

  const [lastKnown, setLastKnown] = useState<Matrix3x3Values>(matrixValues3d);
  if (!sameValues(lastKnown, matrixValues3d)) {
    setLastKnown(matrixValues3d);
    setRaw(fromStore(matrixValues3d));
  }

  const handleChange = (r: 0 | 1 | 2, c: 0 | 1 | 2, val: string) => {
    setRaw((prev) => {
      const next: Raw = [[...prev[0]], [...prev[1]], [...prev[2]]];
      next[r][c] = val;
      return next;
    });
    const n = parseFloat(val);
    if (!isNaN(n)) {
      const next: Matrix3x3Values = [
        [...matrixValues3d[0]] as [number, number, number],
        [...matrixValues3d[1]] as [number, number, number],
        [...matrixValues3d[2]] as [number, number, number],
      ];
      next[r][c] = n;
      setLastKnown(next);
      setMatrixValue3d(r, c, n);
    }
  };

  return (
    <div className="bg-surface/80 backdrop-blur-sm border border-line rounded-xl px-3 py-2.5 select-none">
      <div className="text-[11px] font-medium text-ink-faint mb-1.5 tracking-wide uppercase">
        Matrix (3×3)
      </div>
      <div className="flex items-stretch gap-1.5">
        <div className="w-[3px] rounded-full bg-line-strong" />
        <div className="grid grid-cols-3 gap-1">
          {([0, 1, 2] as const).map((r) =>
            ([0, 1, 2] as const).map((c) => (
              <input
                key={`${r}-${c}`}
                type="text"
                inputMode="decimal"
                aria-label={`Matrix cell row ${r + 1}, column ${c + 1}`}
                value={raw[r][c]}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleChange(r, c, e.target.value)}
                className="w-12 h-8 text-center text-sm text-ink bg-surface-raised border border-line
                           rounded-md focus:outline-none focus:border-accent-strong font-mono"
              />
            ))
          )}
        </div>
        <div className="w-[3px] rounded-full bg-line-strong" />
      </div>
    </div>
  );
}
