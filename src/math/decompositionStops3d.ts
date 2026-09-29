// 3D counterpart of ./decompositionStops: ordered lists of Matrix3x3Values an
// animation can tween through pairwise (Matrix3x3.interpolateDecomposed) to
// show a transform as a composition of simpler steps. Every sequence starts at
// the identity and ends at A itself.

import { Matrix3x3, type Matrix3x3Values } from './Matrix3x3';
import {
  svd3d,
  luDecompose3,
  qrDecompose3,
  eigenDecompose3,
  type Matrix3x3Input,
} from './decompositions3d';
import { IDENTITY3, matmul3, transpose3 } from './linalg3';

function raw(input: Matrix3x3Input): Matrix3x3Values {
  return input instanceof Matrix3x3 ? input.values : input;
}

// SVD:  identity -> V^T -> Sigma*V^T -> U*Sigma*V^T (= A)
export function svdStops3d(input: Matrix3x3Input): Matrix3x3Values[] {
  const { U, Sigma, V } = svd3d(input);
  const vt = transpose3(V.values);
  const sigmaVt = matmul3(Sigma.values, vt);
  return [IDENTITY3, vt, sigmaVt, matmul3(U.values, sigmaVt)];
}

// Eigen:  identity -> Pinv -> D*Pinv -> P*D*Pinv (= A). Null if not
// diagonalisable over the reals.
export function eigenStops3d(input: Matrix3x3Input): Matrix3x3Values[] | null {
  const decomposed = eigenDecompose3(input);
  if (!decomposed) return null;
  const { P, D, Pinv } = decomposed;
  const dPinv = matmul3(D.values, Pinv.values);
  return [IDENTITY3, Pinv.values, dPinv, matmul3(P.values, dPinv)];
}

// LU:  identity -> L21 -> L21*L31 -> L (= L21*L31*L32) -> L*U (= A). One stop
// per elimination step (each an elementary shear), then U on top.
export function luStops3d(input: Matrix3x3Input): Matrix3x3Values[] | null {
  const decomposed = luDecompose3(input);
  if (!decomposed) return null;
  const { L, U } = decomposed;
  const l21: Matrix3x3Values = [[1, 0, 0], [L.values[1][0], 1, 0], [0, 0, 1]];
  const l31: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [L.values[2][0], 0, 1]];
  const afterL21L31 = matmul3(l21, l31);
  return [IDENTITY3, l21, afterL21L31, L.values, matmul3(L.values, U.values)];
}

// QR:  identity -> [e1|a2|a3] -> [e1|e2|a3] -> Q -> Q*R (= A). One stop per
// Gram-Schmidt column, then R on top.
export function qrStops3d(input: Matrix3x3Input): Matrix3x3Values[] {
  const { Q, R } = qrDecompose3(input);
  const a = raw(input);
  const q = Q.values;
  const afterColumn1: Matrix3x3Values = [
    [q[0][0], a[0][1], a[0][2]],
    [q[1][0], a[1][1], a[1][2]],
    [q[2][0], a[2][1], a[2][2]],
  ];
  const afterColumn2: Matrix3x3Values = [
    [q[0][0], q[0][1], a[0][2]],
    [q[1][0], q[1][1], a[1][2]],
    [q[2][0], q[2][1], a[2][2]],
  ];
  return [IDENTITY3, afterColumn1, afterColumn2, q, matmul3(q, R.values)];
}
