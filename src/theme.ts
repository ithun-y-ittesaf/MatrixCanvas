// Design tokens for the parts of the app raw CSS can't reach — mainly
// TransformCanvas's <canvas> 2D context, which draws with literal color
// strings rather than Tailwind classes, plus the store (which assigns
// vector/shape colors as plain data). Keep these in sync with the @theme
// block in src/index.css by hand; there's no automated bridge between the
// two, so a palette change means updating both places.

// î / ĵ — the standard basis vectors. Kept as the familiar red/blue pairing
// (matches the axis colors and every lesson's basis-vector callouts).
export const COLOR_BASIS_X = '#f87171';
export const COLOR_BASIS_Y = '#60a5fa';
// k̂ in 3D mode. Lime rather than green so it can't be mistaken for the
// '#34d399' entry in VECTOR_COLORS below.
export const COLOR_BASIS_Z = '#a3e635';

// Overlay colors for 3D geometric extras (see Overlay3d in the store).
export const COLOR_EIGEN = ['#facc15', '#fb923c', '#f472b6'] as const;
export const COLOR_NULL_SPACE = '#f472b6';
export const COLOR_COLUMN_SPACE = '#22d3ee';
export const COLOR_SINGULAR = ['#c084fc', '#a78bfa', '#818cf8'] as const;

// Cycling palette for user-added vectors/shapes. Shared by the store (which
// assigns colors as items are added) and any UI that needs to render the
// same colors elsewhere — the KaTeX equation panel highlights each vector
// in exactly this color so it's identifiable against the canvas arrow.
export const VECTOR_COLORS = [
  '#facc15', '#34d399', '#c084fc', '#fb923c', '#22d3ee', '#f472b6',
] as const;
