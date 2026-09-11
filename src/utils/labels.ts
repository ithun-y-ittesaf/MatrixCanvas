// Desmos-style item labels: the first item in the expression list is "a",
// the second "b", ... "z", then "aa", "ab", ... — same scheme spreadsheets
// use for column headers. seq is the store's 0-indexed creation-order
// counter (CustomVector.seq / TransformableShape.seq).
export function seqLabel(seq: number): string {
  let n = seq;
  let label = '';
  do {
    label = String.fromCharCode(97 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}
