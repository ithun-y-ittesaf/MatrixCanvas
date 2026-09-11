// Shared display-number formatting — was copy-pasted (with drifting decimal
// counts) across several panels. parseFloat(toFixed(n)) trims trailing
// zeros that toFixed alone leaves in (e.g. "2.0000" -> "2" instead of
// staying "2.0000").
export function fmt(n: number, decimals = 4): string {
  return parseFloat(n.toFixed(decimals)).toString();
}
