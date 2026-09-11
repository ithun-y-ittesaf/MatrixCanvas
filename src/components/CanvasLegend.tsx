import { COLOR_BASIS_X, COLOR_BASIS_Y } from '../theme';

// Static î/ĵ basis-vector key. Extracted out of TransformCanvas so
// PlaygroundPage can lay it out in the same row as AddMenu ("+ button on
// the right of the legend") without TransformCanvas needing to know
// anything about the add menu.
export default function CanvasLegend() {
  return (
    <div
      className="flex flex-col gap-1.5 bg-surface/60 backdrop-blur-sm border border-line
                 rounded-lg px-3 py-2 text-xs font-sans shrink-0"
    >
      <div className="flex items-center gap-2">
        <span className="w-4 h-0.5 inline-block rounded" style={{ background: COLOR_BASIS_X }} />
        <span className="text-ink-dim">î (basis x)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-0.5 inline-block rounded" style={{ background: COLOR_BASIS_Y }} />
        <span className="text-ink-dim">ĵ (basis y)</span>
      </div>
    </div>
  );
}
