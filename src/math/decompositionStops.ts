// Turns the raw decompositions in ./decompositions into ordered "stop"
// sequences — lists of Matrix2x2Values that an animation component can tween
// through pairwise (via Matrix2x2.interpolateDecomposed, or Matrix2x2.lerp for
// a plainer tween) to visualise a transform as a composition of simpler steps.
//
// This is Feature 3's data layer: pure math, no rendering. Every sequence
// starts at the identity and ends at A itself; the stops in between are what
// each decomposition contributes, in application order (each new factor is
// "applied on top", i.e. left-multiplied onto the running product).

import { Matrix2x2, type Matrix2x2Values } from './Matrix2x2';
import {
  svd,
  luDecompose,
  qrDecompose,
  eigenDecompose,
  type Matrix2x2Input,
} from './decompositions';

const IDENTITY: Matrix2x2Values = [[1, 0], [0, 1]];

function raw(input: Matrix2x2Input): Matrix2x2Values {
  return input instanceof Matrix2x2 ? input.values : input;
}

function matmul(x: Matrix2x2Values, y: Matrix2x2Values): Matrix2x2Values {
  return [
    [
      x[0][0] * y[0][0] + x[0][1] * y[1][0],
      x[0][0] * y[0][1] + x[0][1] * y[1][1],
    ],
    [
      x[1][0] * y[0][0] + x[1][1] * y[1][0],
      x[1][0] * y[0][1] + x[1][1] * y[1][1],
    ],
  ];
}

function transpose(m: Matrix2x2Values): Matrix2x2Values {
  return [[m[0][0], m[1][0]], [m[0][1], m[1][1]]];
}

// ---------------------------------------------------------------------------
// SVD:  identity -> V^T -> Sigma*V^T -> U*Sigma*V^T (= A)
// ---------------------------------------------------------------------------

// Three steps after the identity: the input rotation/reflection V^T, then the
// axis-aligned scale Sigma on top, then the output rotation/reflection U on top.
export function svdStops(input: Matrix2x2Input): Matrix2x2Values[] {
  const { U, Sigma, V } = svd(input);
  const vt = transpose(V.values);
  const sigmaVt = matmul(Sigma.values, vt);
  return [IDENTITY, vt, sigmaVt, matmul(U.values, sigmaVt)];
}

// ---------------------------------------------------------------------------
// Eigendecomposition:  identity -> Pinv -> D*Pinv -> P*D*Pinv (= A)
// ---------------------------------------------------------------------------

// Three steps: change of basis into the eigenbasis, the diagonal scale D along
// the eigen-axes, then the change of basis back. The proposal names the first
// step "P"; with this repo's `A = P*D*Pinv` convention (P's columns are the
// eigenvectors) the matrix that maps the standard basis into the eigenbasis is
// Pinv, so that is the first stop. Returns null when the matrix has no real
// eigendecomposition (complex eigenvalues, or a defective repeated eigenvalue),
// mirroring eigenDecompose.
export function eigenStops(input: Matrix2x2Input): Matrix2x2Values[] | null {
  const decomposed = eigenDecompose(input);
  if (!decomposed) return null;
  const { P, D, Pinv } = decomposed;
  const dPinv = matmul(D.values, Pinv.values);
  return [IDENTITY, Pinv.values, dPinv, matmul(P.values, dPinv)];
}

// ---------------------------------------------------------------------------
// LU:  identity -> L -> L*U (= A)
// ---------------------------------------------------------------------------

// One stop per elimination step. A 2x2 unpivoted elimination has exactly one
// step — clearing the (2,1) entry — and its elementary shear is L itself
// ([[1,0],[c/a,1]]). The final step applies the upper-triangular factor U on
// top to resolve the full matrix. Returns null when the top-left pivot is zero
// (no unpivoted LU), mirroring luDecompose.
export function luStops(input: Matrix2x2Input): Matrix2x2Values[] | null {
  const decomposed = luDecompose(input);
  if (!decomposed) return null;
  const { L, U } = decomposed;
  return [IDENTITY, L.values, matmul(L.values, U.values)];
}

// ---------------------------------------------------------------------------
// QR:  identity -> [e1 | a2] -> Q -> Q*R (= A)
// ---------------------------------------------------------------------------

// One stop per column of the Gram-Schmidt process: after column 1 the first
// basis vector is fixed to e1 (a1 normalised) while the second column is still
// the raw a2; after column 2 both columns are orthonormal (Q). The final step
// applies R on top to resolve the full matrix.
export function qrStops(input: Matrix2x2Input): Matrix2x2Values[] {
  const { Q, R } = qrDecompose(input);
  const a = raw(input);
  const afterColumn1: Matrix2x2Values = [
    [Q.a, a[0][1]],
    [Q.c, a[1][1]],
  ];
  return [IDENTITY, afterColumn1, Q.values, matmul(Q.values, R.values)];
}
