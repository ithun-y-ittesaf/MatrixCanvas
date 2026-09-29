// 3D counterpart of ./decompositionSequences: wraps the stops from
// ./decompositionStops3d with the labels DecompositionPlayer shows.

import type { Matrix3x3Values } from './Matrix3x3';
import type { Matrix3x3Input } from './decompositions3d';
import type { DecompositionKind } from './decompositionSequences';
import { svdStops3d, eigenStops3d, luStops3d, qrStops3d } from './decompositionStops3d';

export interface DecompositionStep3d {
  matrix: Matrix3x3Values;
  label: string;
}

export interface DecompositionSequence3d {
  title: string;
  start: Matrix3x3Values;
  steps: DecompositionStep3d[];
}

export function svdSequence3d(input: Matrix3x3Input): DecompositionSequence3d {
  const [start, vt, sigmaVt, a] = svdStops3d(input);
  return {
    title: 'Singular Value Decomposition',
    start,
    steps: [
      { matrix: vt, label: "Applying V^T — rotating the sphere into the input's principal axes" },
      { matrix: sigmaVt, label: 'Stretching along the three singular values (Σ) — sphere becomes an ellipsoid' },
      { matrix: a, label: 'Applying U — rotating the ellipsoid into its final orientation' },
    ],
  };
}

export function eigenSequence3d(input: Matrix3x3Input): DecompositionSequence3d | null {
  const stops = eigenStops3d(input);
  if (!stops) return null;
  const [start, pinv, dPinv, a] = stops;
  return {
    title: 'Eigendecomposition',
    start,
    steps: [
      { matrix: pinv, label: 'Changing to the eigenbasis (P⁻¹)' },
      { matrix: dPinv, label: 'Scaling along the three eigenvalues (D)' },
      { matrix: a, label: 'Changing back to the standard basis (P)' },
    ],
  };
}

export function luSequence3d(input: Matrix3x3Input): DecompositionSequence3d | null {
  const stops = luStops3d(input);
  if (!stops) return null;
  const [start, l21, l21l31, l, a] = stops;
  return {
    title: 'LU Decomposition',
    start,
    steps: [
      { matrix: l21, label: 'Eliminating below the first pivot — row 2 (shear L₂₁)' },
      { matrix: l21l31, label: 'Eliminating below the first pivot — row 3 (shear L₃₁)' },
      { matrix: l, label: 'Eliminating below the second pivot (shear L₃₂) — L complete' },
      { matrix: a, label: 'Applying the upper-triangular factor (U)' },
    ],
  };
}

export function qrSequence3d(input: Matrix3x3Input): DecompositionSequence3d {
  const [start, col1, col2, q, a] = qrStops3d(input);
  return {
    title: 'QR Decomposition',
    start,
    steps: [
      { matrix: col1, label: 'Orthonormalizing column 1 (e₁)' },
      { matrix: col2, label: 'Orthonormalizing column 2 (e₂, Gram-Schmidt)' },
      { matrix: q, label: 'Orthonormalizing column 3 (e₃, Gram-Schmidt)' },
      { matrix: a, label: 'Applying R — the remaining scale/shear' },
    ],
  };
}

export function buildDecompositionSequence3d(
  kind: DecompositionKind,
  input: Matrix3x3Input,
): DecompositionSequence3d | null {
  switch (kind) {
    case 'svd': return svdSequence3d(input);
    case 'eigen': return eigenSequence3d(input);
    case 'lu': return luSequence3d(input);
    case 'qr': return qrSequence3d(input);
  }
}
