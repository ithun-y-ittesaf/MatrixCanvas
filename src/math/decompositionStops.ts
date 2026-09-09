// Turns the raw decompositions in ./decompositions into ordered "stop"
// sequences — lists of Matrix2x2Values that an animation component can tween
// through pairwise (via Matrix2x2.interpolateDecomposed, or Matrix2x2.lerp for
// a plainer tween) to visualise a transform as a composition of simpler steps.
//
// This is Feature 3's data layer: pure math, no rendering. Every sequence
// starts at the identity and ends at A itself; the stops in between are what
// each decomposition contributes, in application order (each new factor is
// "applied on top", i.e. left-multiplied onto the running product).

import { type Matrix2x2Values } from './Matrix2x2';
import { svd, eigenDecompose, type Matrix2x2Input } from './decompositions';

const IDENTITY: Matrix2x2Values = [[1, 0], [0, 1]];

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
