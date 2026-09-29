// 3x3 matrix decompositions (SVD, LU, QR, eigen), the 3D counterparts of
// ./decompositions. Same conventions: every function accepts a `Matrix3x3` or
// raw `Matrix3x3Values`, returns `Matrix3x3` instances, and satisfies its
// reconstruction identity (A = U*Sigma*V^T, A = L*U, A = Q*R, A = P*D*P^-1) to
// within the project's 6-decimal tolerance; see decompositions3d.test.ts.

import { Matrix3x3, type Matrix3x3Values } from './Matrix3x3';
import {
  EPS,
  type Vec3,
  column3,
  cross3,
  diag3,
  dot3,
  fromColumns3,
  norm3,
  scale3,
  sub3,
  svd3,
} from './linalg3';

export type Matrix3x3Input = Matrix3x3 | Matrix3x3Values;

function coerce(input: Matrix3x3Input): Matrix3x3 {
  return input instanceof Matrix3x3 ? input : new Matrix3x3(input);
}

// SVD  -  A = U * Sigma * V^T. Sigma is descending and non-negative; U is a
// proper rotation (V may be a reflection when det(A) < 0).
export function svd3d(input: Matrix3x3Input): {
  U: Matrix3x3;
  Sigma: Matrix3x3;
  V: Matrix3x3;
} {
  const { U, sigma, V } = svd3(coerce(input).values);
  return {
    U: new Matrix3x3(U),
    Sigma: new Matrix3x3(diag3(sigma[0], sigma[1], sigma[2])),
    V: new Matrix3x3(V),
  };
}

// LU  -  A = L * U (Doolittle, no pivoting). Returns null when a leading pivot
// is zero, mirroring the 2D luDecompose.
export function luDecompose3(
  input: Matrix3x3Input,
): { L: Matrix3x3; U: Matrix3x3 } | null {
  const a = coerce(input).values;
  const u: Matrix3x3Values = [[...a[0]], [...a[1]], [...a[2]]];
  const l: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let k = 0; k < 2; k++) {
    if (Math.abs(u[k][k]) <= EPS) return null;
    for (let i = k + 1; i < 3; i++) {
      const f = u[i][k] / u[k][k];
      l[i][k] = f;
      for (let j = k; j < 3; j++) u[i][j] -= f * u[k][j];
      u[i][k] = 0;
    }
  }
  return { L: new Matrix3x3(l), U: new Matrix3x3(u) };
}

// QR  -  A = Q * R (classical Gram-Schmidt on the columns). A degenerate column
// leaves a zero on R's diagonal and its Q column is completed orthogonally, so
// Q stays orthonormal and Q*R still reproduces A.
export function qrDecompose3(input: Matrix3x3Input): { Q: Matrix3x3; R: Matrix3x3 } {
  const m = coerce(input).values;
  const cols: Vec3[] = [column3(m, 0), column3(m, 1), column3(m, 2)];
  const es: Vec3[] = [];
  const R: Matrix3x3Values = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

  for (let k = 0; k < 3; k++) {
    let residual: Vec3 = cols[k];
    for (let j = 0; j < es.length; j++) {
      R[j][k] = dot3(cols[k], es[j]);
      residual = sub3(residual, scale3(es[j], R[j][k]));
    }
    const n = norm3(residual);
    if (n > EPS) {
      R[k][k] = n;
      es.push(scale3(residual, 1 / n));
    } else {
      R[k][k] = 0;
      es.push(orthogonalTo(es));
    }
  }
  return { Q: new Matrix3x3(fromColumns3(es[0], es[1], es[2])), R: new Matrix3x3(R) };
}

// A unit vector orthogonal to every vector in `es` (0-2 orthonormal vectors).
function orthogonalTo(es: Vec3[]): Vec3 {
  if (es.length === 0) return [1, 0, 0];
  if (es.length === 1) {
    const [x, y, z] = es[0];
    const axis: Vec3 = Math.abs(x) <= Math.abs(y) && Math.abs(x) <= Math.abs(z)
      ? [1, 0, 0]
      : Math.abs(y) <= Math.abs(z) ? [0, 1, 0] : [0, 0, 1];
    const c = cross3(es[0], axis);
    const n = norm3(c);
    return scale3(c, 1 / n);
  }
  const c = cross3(es[0], es[1]);
  const n = norm3(c);
  return n > EPS ? scale3(c, 1 / n) : [0, 0, 1];
}

// Eigendecomposition  -  A = P * D * P^-1. Returns null for complex eigenvalues
// and for defective matrices (not enough independent real eigenvectors, e.g. a
// shear), neither of which is diagonalisable over the reals.
export function eigenDecompose3(
  input: Matrix3x3Input,
): { P: Matrix3x3; D: Matrix3x3; Pinv: Matrix3x3 } | null {
  const m = coerce(input);
  if (m.eigenvalues().type !== 'real') return null;
  const pairs = m.eigenvectors();
  if (pairs.length < 3) return null;

  const P = new Matrix3x3(
    fromColumns3(pairs[0].vector, pairs[1].vector, pairs[2].vector),
  );
  const Pinv = P.inverse();
  if (!Pinv) return null;
  return {
    P,
    D: new Matrix3x3(diag3(pairs[0].value, pairs[1].value, pairs[2].value)),
    Pinv,
  };
}
