// Wraps the stop sequences in ./decompositionStops with the human-readable
// labels DecompositionPlayer (src/components/DecompositionPlayer.tsx) shows
// for each step. Kept out of that component file (rather than defined inline)
// so a plain function/const export doesn't sit next to the component's
// default export — see react-refresh/only-export-components.

import type { Matrix2x2Values } from './Matrix2x2';
import type { Matrix2x2Input } from './decompositions';
import { svdStops, eigenStops, luStops, qrStops } from './decompositionStops';

// One frame of a decomposition's animation: the matrix reached at the END of
// this step, and a label for what happened to get there.
export interface DecompositionStep {
  matrix: Matrix2x2Values;
  label: string;
}

// A decomposition laid out for DecompositionPlayer: a starting matrix
// (always the identity, per decompositionStops) plus the ordered steps that
// tween it into A.
export interface DecompositionSequence {
  title: string;
  start: Matrix2x2Values;
  steps: DecompositionStep[];
}

export type DecompositionKind = 'svd' | 'eigen' | 'lu' | 'qr';

export function svdSequence(input: Matrix2x2Input): DecompositionSequence {
  const [start, vt, sigmaVt, a] = svdStops(input);
  return {
    title: 'Singular Value Decomposition',
    start,
    steps: [
      { matrix: vt, label: "Applying V^T — rotating into the input's principal axes" },
      { matrix: sigmaVt, label: 'Scaling along the singular values (Σ)' },
      { matrix: a, label: 'Applying U — rotating into the output orientation' },
    ],
  };
}

export function eigenSequence(input: Matrix2x2Input): DecompositionSequence | null {
  const stops = eigenStops(input);
  if (!stops) return null;
  const [start, pinv, dPinv, a] = stops;
  return {
    title: 'Eigendecomposition',
    start,
    steps: [
      { matrix: pinv, label: 'Changing to the eigenbasis (P⁻¹)' },
      { matrix: dPinv, label: 'Scaling along the eigenvalues (D)' },
      { matrix: a, label: 'Changing back to the standard basis (P)' },
    ],
  };
}

export function luSequence(input: Matrix2x2Input): DecompositionSequence | null {
  const stops = luStops(input);
  if (!stops) return null;
  const [start, l, a] = stops;
  return {
    title: 'LU Decomposition',
    start,
    steps: [
      { matrix: l, label: 'Applying the elimination shear (L)' },
      { matrix: a, label: 'Applying the upper-triangular factor (U)' },
    ],
  };
}

export function qrSequence(input: Matrix2x2Input): DecompositionSequence {
  const [start, afterColumn1, q, a] = qrStops(input);
  return {
    title: 'QR Decomposition',
    start,
    steps: [
      { matrix: afterColumn1, label: 'Orthonormalizing column 1 (e₁)' },
      { matrix: q, label: 'Orthonormalizing column 2 (e₂, Gram-Schmidt)' },
      { matrix: a, label: 'Applying R — the remaining scale/shear' },
    ],
  };
}

// Dispatches on a DecompositionKind — what LessonRunner uses to turn a
// decomposition-track step's `{ decomposition, matrix }` into a sequence
// without a switch at the call site.
export function buildDecompositionSequence(
  kind: DecompositionKind,
  input: Matrix2x2Input,
): DecompositionSequence | null {
  switch (kind) {
    case 'svd': return svdSequence(input);
    case 'eigen': return eigenSequence(input);
    case 'lu': return luSequence(input);
    case 'qr': return qrSequence(input);
  }
}
