import { useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useKatexOverlay } from '../utils/useKatexOverlay';
import type { Matrix2x2Values } from '../math/Matrix2x2';

function toRaw(v: number): string {
  // Keep it concise — no trailing .0 noise
  return parseFloat(v.toFixed(6)).toString();
}

type Raw = [[string, string], [string, string]];

function fromStore(vals: Matrix2x2Values): Raw {
  return [
    [toRaw(vals[0][0]), toRaw(vals[0][1])],
    [toRaw(vals[1][0]), toRaw(vals[1][1])],
  ];
}

function sameValues(a: Matrix2x2Values, b: Matrix2x2Values): boolean {
  return a[0][0] === b[0][0] && a[0][1] === b[0][1] && a[1][0] === b[1][0] && a[1][1] === b[1][1];
}

const CELL_IDS = ['mb00', 'mb01', 'mb10', 'mb11'] as const;
const FONT_PX = 21;
// Expands each transparent input a few px past its measured glyph so a
// single narrow digit ("1") is still an easy click/tap target — invisible,
// since the input has no border/background of its own.
const PAD = 4;

// The 2×2 matrix, rendered as one real `\begin{bmatrix}` KaTeX expression
// (not a hand-approximated bracket-plus-input-grid) with a transparent,
// precisely-positioned <input> laid over each cell — see useKatexOverlay
// for how. This is now the *only* place the matrix is edited (the equation
// panel always shows it inline).
export default function MatrixBracket() {
  const matrixValues = useAppStore((s) => s.matrixValues);
  const setMatrixValue = useAppStore((s) => s.setMatrixValue);
  const [raw, setRaw] = useState<Raw>(() => fromStore(matrixValues));

  // The values this instance itself last told the store to become —
  // stamped *proactively* inside handleChange(), before the store's
  // update round-trips back as new props. That makes the sync check below
  // able to tell "this prop change is just an echo of our own edit"
  // (lastKnown already matches, so it does nothing — `raw` keeps whatever
  // the user is mid-typing, e.g. "1." before the "5" in "1.5") apart from
  // a genuinely external change (a preset, a lesson reload, URL hydration
  // — none of which went through handleChange(), so lastKnown won't
  // already match).
  //
  // This has to be useState, not a ref: React's "adjusting state when a
  // prop changes" pattern (calling a setter directly during render) is
  // only safe with real state — it's how React de-dupes StrictMode's
  // double-invoke of render (the second call sees the already-updated
  // state and takes the no-op branch). A plain ref mutated here bypasses
  // that bookkeeping, so the double-invoke can leave `raw` and the ref
  // disagreeing about which one "won" — this is what made a freshly-typed
  // digit sometimes render back as the old value in a second, unrelated
  // instance of this same matrix (e.g. the equation panel's own copy).
  const [lastKnown, setLastKnown] = useState<Matrix2x2Values>(matrixValues);
  if (!sameValues(lastKnown, matrixValues)) {
    setLastKnown(matrixValues);
    setRaw(fromStore(matrixValues));
  }

  // \phantom{0} keeps a blank cell's measured width from collapsing to
  // zero while it's mid-edit (e.g. just cleared to type a new value).
  const cellTex = (v: string) => (v === '' ? '\\phantom{0}' : v);
  const tex = `\\begin{bmatrix}` +
    `\\htmlId{${CELL_IDS[0]}}{${cellTex(raw[0][0])}} & \\htmlId{${CELL_IDS[1]}}{${cellTex(raw[0][1])}} \\\\ ` +
    `\\htmlId{${CELL_IDS[2]}}{${cellTex(raw[1][0])}} & \\htmlId{${CELL_IDS[3]}}{${cellTex(raw[1][1])}}` +
    `\\end{bmatrix}`;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const { containerRef, rects } = useKatexOverlay(tex, CELL_IDS, anchorRef);

  const handleChange = (r: 0 | 1, c: 0 | 1, val: string) => {
    setRaw((prev) => {
      const next: Raw = [[...prev[0]], [...prev[1]]];
      next[r][c] = val;
      return next;
    });
    const n = parseFloat(val);
    if (!isNaN(n)) {
      const next: Matrix2x2Values = [
        [...matrixValues[0]] as [number, number],
        [...matrixValues[1]] as [number, number],
      ];
      next[r][c] = n;
      setLastKnown(next);
      setMatrixValue(r, c, n);
    }
  };

  return (
    <span ref={anchorRef} className="relative inline-block select-none" style={{ fontSize: FONT_PX, lineHeight: 1 }}>
      <span ref={containerRef} className="text-ink inline-block align-top" />
      {([0, 1] as const).map((r) =>
        ([0, 1] as const).map((c) => {
          const idx = r * 2 + c;
          const id = CELL_IDS[idx];
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
