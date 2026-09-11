import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import katex from 'katex';

export interface CellRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Renders `tex` (expected to wrap each editable number in
// \htmlId{someId}{...}) into a KaTeX container and measures where each of
// `cellIds` landed *relative to `anchorRef`* — the positioned ancestor a
// caller lays its overlay <input>s against — so a caller can position a
// transparent <input> exactly over each rendered digit. That's the whole
// trick behind a "real KaTeX matrix that's also editable": there is
// exactly one declaration of the numbers — the KaTeX render — and the
// inputs are pure interaction surfaces sized to match it, not a second
// parallel representation that has to be kept in sync by hand.
//
// anchorRef has to be the actual `position: relative` element the inputs
// are absolutely positioned against, not just the span KaTeX renders
// into — KaTeX's own internal layout (vlists with negative margins, used
// to stack matrix rows and stretch bracket delimiters) can leave that
// inner span's own bounding box offset from where it visually sits, so
// measuring against it directly showed rects a bit above-and-left of the
// actual glyphs once the two were combined with an outer wrapper.
//
// Measures twice: immediately (synchronous, so there's no first-paint
// flash with no inputs at all) and again once `document.fonts.ready`
// resolves. KaTeX's own math webfonts (KaTeX_Main, KaTeX_Size1-4, the ones
// stretchy bracket delimiters specifically depend on) aren't guaranteed
// loaded on that first measurement — the immediate pass can land against
// a fallback font's metrics, a few px off from where the glyphs sit once
// the real font swaps in — so re-measuring after fonts.ready is what
// actually settles the overlay into place, not just approximately near it.
//
// \htmlId requires `trust: true`; safe here because every caller builds
// `tex` from numbers it already parsed with parseFloat (see MatrixBracket/
// VectorBracket), never from raw user text.
export function useKatexOverlay(
  tex: string,
  cellIds: readonly string[],
  anchorRef: RefObject<HTMLElement | null>,
) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [rects, setRects] = useState<Record<string, CellRect>>({});

  useLayoutEffect(() => {
    const el = containerRef.current;
    const anchor = anchorRef.current;
    if (!el || !anchor) return;
    el.innerHTML = '';
    katex.render(tex, el, { throwOnError: false, trust: true, strict: false });

    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const anchorRect = anchor.getBoundingClientRect();
      const next: Record<string, CellRect> = {};
      for (const id of cellIds) {
        const cellEl = el.querySelector(`#${CSS.escape(id)}`);
        if (!cellEl) continue;
        const r = cellEl.getBoundingClientRect();
        next[id] = {
          left: r.left - anchorRect.left,
          top: r.top - anchorRect.top,
          width: r.width,
          height: r.height,
        };
      }
      setRects(next);
    };

    measure();
    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }
    return () => { cancelled = true; };
    // cellIds is a fixed-shape array per caller (same ids every render) —
    // comparing its join avoids an effect re-run from a fresh array
    // identity on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, cellIds.join(',')]);

  return { containerRef, rects };
}
