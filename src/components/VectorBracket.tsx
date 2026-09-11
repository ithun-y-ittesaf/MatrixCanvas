import { useEffect, useId, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useKatexOverlay } from '../utils/useKatexOverlay';
import { fmt } from '../utils/format';

const FONT_PX = 21;
// Expands each transparent input a few px past its measured glyph so a
// single narrow digit ("1") is still an easy click/tap target — invisible,
// since the input has no border/background of its own.
const PAD = 4;

interface VectorBracketProps {
  id: string;
  x: number;
  y: number;
  color: string;
  // True only for the row just created this session — starts blank with
  // the cursor already in x, rather than pre-filled with a default the
  // user has to notice and clear first.
  autoFocusX?: boolean;
}

// A column-vector bracket rendered as one real `\begin{bmatrix}` KaTeX
// expression (not a hand-drawn bracket next to a plain input grid), with a
// transparent, precisely-positioned <input> over each of the two cells —
// see useKatexOverlay. There's exactly one declaration of "what this
// vector's numbers are": the KaTeX render itself; the inputs are pure
// interaction surfaces sized to match it. Shared by VectorPopups (the
// floating card next to the add menu) and EquationPanel (the same vector
// inline in "Mv = v'") — both read/write the same store vector via
// updateVector, so editing either place updates the other live.
export default function VectorBracket({ id, x, y, color, autoFocusX }: VectorBracketProps) {
  const updateVector = useAppStore((s) => s.updateVector);
  const [raw, setRaw] = useState<[string, string]>(autoFocusX ? ['', ''] : [fmt(x, 6), fmt(y, 6)]);

  // The (x, y) this instance itself last told the store to become —
  // stamped *proactively* inside commit(), before the store's update
  // round-trips back as new props. That makes the sync check below able
  // to tell "this prop change is just an echo of our own edit" (lastKnown
  // already matches, so it does nothing — `raw` keeps whatever the user is
  // mid-typing, e.g. "3." before the "5" in "3.5") apart from a genuinely
  // external change (a canvas drag, a lesson reload, URL hydration — none
  // of which went through commit(), so lastKnown won't already match).
  //
  // This has to be useState, not a ref: React's "adjusting state when a
  // prop changes" pattern (calling a setter directly during render) is
  // only safe with real state — it's how React de-dupes StrictMode's
  // double-invoke of render (the second call sees the already-updated
  // state and takes the no-op branch). A plain ref mutated here bypasses
  // that bookkeeping, so the double-invoke can leave `raw` and the ref
  // disagreeing about which one "won".
  const [lastKnown, setLastKnown] = useState<[number, number]>([x, y]);
  if (lastKnown[0] !== x || lastKnown[1] !== y) {
    setLastKnown([x, y]);
    setRaw([fmt(x, 6), fmt(y, 6)]);
  }

  const xInputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const cellIds = [`${uid}x`, `${uid}y`] as const;

  // \phantom{0} keeps a blank cell's measured width from collapsing to
  // zero while it's mid-edit (e.g. just cleared to type a new value).
  const cellTex = (v: string) => (v === '' ? '\\phantom{0}' : v);
  const tex = `\\textcolor{${color}}{\\begin{bmatrix}` +
    `\\htmlId{${cellIds[0]}}{${cellTex(raw[0])}} \\\\ \\htmlId{${cellIds[1]}}{${cellTex(raw[1])}}` +
    `\\end{bmatrix}}`;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const { containerRef, rects } = useKatexOverlay(tex, cellIds, anchorRef);

  // Focus the x cell the first time its overlay rect becomes available —
  // can't focus a not-yet-positioned input meaningfully before that. The
  // boolean dependency only flips false->true once (a measured cell stays
  // measured), so this fires exactly once rather than re-stealing focus
  // back after the user deliberately clicks away.
  const xCellMeasured = !!rects[cellIds[0]];
  useEffect(() => {
    if (autoFocusX && xCellMeasured) xInputRef.current?.focus();
  }, [autoFocusX, xCellMeasured]);

  const commit = (which: 0 | 1, val: string) => {
    setRaw((r) => (which === 0 ? [val, r[1]] : [r[0], val]));
    const n = parseFloat(val);
    if (!isNaN(n)) {
      const next: [number, number] = which === 0 ? [n, y] : [x, n];
      setLastKnown(next);
      updateVector(id, next[0], next[1]);
    }
  };

  return (
    <span ref={anchorRef} className="relative inline-block select-none" style={{ fontSize: FONT_PX, lineHeight: 1 }}>
      <span ref={containerRef} className="inline-block align-top" />
      {([0, 1] as const).map((which) => {
        const rect = rects[cellIds[which]];
        if (!rect) return null;
        return (
          <input
            key={which}
            ref={which === 0 ? xInputRef : undefined}
            type="text"
            inputMode="decimal"
            aria-label={which === 0 ? 'Vector x' : 'Vector y'}
            value={raw[which]}
            onFocus={(e) => e.target.select()}
            onChange={(e) => commit(which, e.target.value)}
            className="katex-overlay-input absolute bg-transparent text-transparent focus:outline-none"
            style={{
              left: rect.left - PAD,
              top: rect.top - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              // Not `color` — the input's own text must stay fully
              // transparent (only the KaTeX glyph underneath is visible);
              // caretColor alone tints just the blinking cursor.
              caretColor: color,
            }}
          />
        );
      })}
    </span>
  );
}
