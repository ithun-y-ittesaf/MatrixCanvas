// Small dependency-free 3x3 linear-algebra kernel shared by Matrix3x3 and the
// 3D decompositions: raw matrix/vector helpers, a Jacobi eigensolver for
// symmetric matrices (the engine behind the SVD), and quaternion helpers used
// to interpolate rotations. Everything here works on plain arrays so it can be
// used without constructing Matrix3x3 instances.

import type { Matrix3x3Values } from './Matrix3x3';

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number]; // [w, x, y, z]

export const EPS = 1e-9;

export const IDENTITY3: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// ---------------------------------------------------------------------------
// vectors
// ---------------------------------------------------------------------------

export function dot3(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function norm3(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function normalize3(a: Vec3): Vec3 | null {
  const n = norm3(a);
  return n <= EPS ? null : [a[0] / n, a[1] / n, a[2] / n];
}

export function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale3(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

// Extends a list of 0-3 mutually orthonormal vectors to a full orthonormal
// basis of R^3 (Gram-Schmidt on whichever standard axis is least covered).
export function completeBasis(given: Vec3[]): Vec3[] {
  const basis = given.slice();
  const axes: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  while (basis.length < 3) {
    let best: Vec3 | null = null;
    let bestNorm = -1;
    for (const axis of axes) {
      let r: Vec3 = axis;
      for (const b of basis) r = sub3(r, scale3(b, dot3(r, b)));
      const n = norm3(r);
      if (n > bestNorm) {
        bestNorm = n;
        best = r;
      }
    }
    basis.push(normalize3(best!) ?? [1, 0, 0]);
  }
  return basis;
}

// ---------------------------------------------------------------------------
// matrices
// ---------------------------------------------------------------------------

export function matmul3(x: Matrix3x3Values, y: Matrix3x3Values): Matrix3x3Values {
  const out: Matrix3x3Values = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r][c] = x[r][0] * y[0][c] + x[r][1] * y[1][c] + x[r][2] * y[2][c];
    }
  }
  return out;
}

export function transpose3(m: Matrix3x3Values): Matrix3x3Values {
  return [
    [m[0][0], m[1][0], m[2][0]],
    [m[0][1], m[1][1], m[2][1]],
    [m[0][2], m[1][2], m[2][2]],
  ];
}

export function det3(m: Matrix3x3Values): number {
  return (
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
  );
}

export function fromColumns3(c0: Vec3, c1: Vec3, c2: Vec3): Matrix3x3Values {
  return [
    [c0[0], c1[0], c2[0]],
    [c0[1], c1[1], c2[1]],
    [c0[2], c1[2], c2[2]],
  ];
}

export function column3(m: Matrix3x3Values, c: number): Vec3 {
  return [m[0][c], m[1][c], m[2][c]];
}

export function diag3(a: number, b: number, c: number): Matrix3x3Values {
  return [[a, 0, 0], [0, b, 0], [0, 0, c]];
}

export function lerpMatrix3(
  x: Matrix3x3Values,
  y: Matrix3x3Values,
  t: number,
): Matrix3x3Values {
  const out: Matrix3x3Values = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) out[r][c] = x[r][c] + (y[r][c] - x[r][c]) * t;
  }
  return out;
}

// ---------------------------------------------------------------------------
// symmetric eigensolver (cyclic Jacobi)
// ---------------------------------------------------------------------------

// Eigen-decomposition of a real symmetric 3x3: returns eigenvalues in
// descending order and the matching orthonormal eigenvectors as the COLUMNS of
// `vectors`. Jacobi is unconditionally stable for symmetric input, which is why
// it backs the SVD (via A^T*A) instead of the closed-form cubic.
export function symmetricEigen3(input: Matrix3x3Values): {
  values: Vec3;
  vectors: Matrix3x3Values;
} {
  const a: Matrix3x3Values = [
    [input[0][0], input[0][1], input[0][2]],
    [input[1][0], input[1][1], input[1][2]],
    [input[2][0], input[2][1], input[2][2]],
  ];
  const v: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  for (let sweep = 0; sweep < 60; sweep++) {
    const off = a[0][1] * a[0][1] + a[0][2] * a[0][2] + a[1][2] * a[1][2];
    if (off < 1e-30) break;
    for (const [p, q] of [[0, 1], [0, 2], [1, 2]] as const) {
      if (Math.abs(a[p][q]) < 1e-300) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1);
      const s = t * c;
      for (let k = 0; k < 3; k++) {
        const akp = a[k][p];
        const akq = a[k][q];
        a[k][p] = c * akp - s * akq;
        a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p][k];
        const aqk = a[q][k];
        a[p][k] = c * apk - s * aqk;
        a[q][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k][p];
        const vkq = v[k][q];
        v[k][p] = c * vkp - s * vkq;
        v[k][q] = s * vkp + c * vkq;
      }
    }
  }

  const order = [0, 1, 2].sort((i, j) => a[j][j] - a[i][i]);
  return {
    values: [a[order[0]][order[0]], a[order[1]][order[1]], a[order[2]][order[2]]],
    vectors: fromColumns3(
      column3(v, order[0]),
      column3(v, order[1]),
      column3(v, order[2]),
    ),
  };
}

// ---------------------------------------------------------------------------
// SVD  (U proper rotation; Sigma >= 0 descending; V possibly a reflection)
// ---------------------------------------------------------------------------

// V and the singular values come from the eigen-decomposition of A^T*A. Each
// U column is A*v_i renormalised; directions with sigma ~ 0 constrain nothing,
// so those U columns are filled in to complete an orthonormal basis. If U comes
// out as a reflection, one U column and its V partner are negated together
// (which leaves U*Sigma*V^T unchanged) so U is always a proper rotation.
export function svd3(m: Matrix3x3Values): {
  U: Matrix3x3Values;
  sigma: Vec3;
  V: Matrix3x3Values;
} {
  const { values, vectors } = symmetricEigen3(matmul3(transpose3(m), m));
  const sigma: Vec3 = [
    Math.sqrt(Math.max(values[0], 0)),
    Math.sqrt(Math.max(values[1], 0)),
    Math.sqrt(Math.max(values[2], 0)),
  ];
  const cutoff = EPS * Math.max(1, sigma[0]);

  const vCols: Vec3[] = [column3(vectors, 0), column3(vectors, 1), column3(vectors, 2)];
  const uCols: Vec3[] = [];
  for (let i = 0; i < 3; i++) {
    if (sigma[i] <= cutoff) break;
    const av = mulVec(m, vCols[i]);
    const u = normalize3(av);
    if (!u) break;
    uCols.push(u);
  }
  const rank = uCols.length;
  const uFull = completeBasis(uCols);
  for (let i = rank; i < 3; i++) sigma[i] = 0;

  let U = fromColumns3(uFull[0], uFull[1], uFull[2]);
  let V = fromColumns3(vCols[0], vCols[1], vCols[2]);
  if (det3(U) < 0) {
    // Flip the last U column together with its V partner.
    uFull[2] = scale3(uFull[2], -1);
    vCols[2] = scale3(vCols[2], -1);
    U = fromColumns3(uFull[0], uFull[1], uFull[2]);
    V = fromColumns3(vCols[0], vCols[1], vCols[2]);
  }
  return { U, sigma, V };
}

export function mulVec(m: Matrix3x3Values, v: Vec3): Vec3 {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
  ];
}

// ---------------------------------------------------------------------------
// polar decomposition  M = Q * S  (Q proper rotation, S symmetric)
// ---------------------------------------------------------------------------

// From the SVD: R = U*V^T, S = V*Sigma*V^T. If R is a reflection (det -1) we
// use -R, a proper rotation because -I has determinant -1 in 3D, and absorb
// the sign into S (M = R*S = (-R)*(-S)). S may then have negative eigenvalues,
// which is exactly the "flip" part of the transform.
export function polar3(m: Matrix3x3Values): { Q: Matrix3x3Values; S: Matrix3x3Values } {
  const { U, sigma, V } = svd3(m);
  const R = matmul3(U, transpose3(V));
  let S = matmul3(matmul3(V, diag3(sigma[0], sigma[1], sigma[2])), transpose3(V));
  let Q = R;
  if (det3(R) < 0) {
    Q = R.map((row) => row.map((x) => -x)) as Matrix3x3Values;
    S = S.map((row) => row.map((x) => -x)) as Matrix3x3Values;
  }
  // Symmetrise S against round-off.
  S = [
    [S[0][0], (S[0][1] + S[1][0]) / 2, (S[0][2] + S[2][0]) / 2],
    [(S[0][1] + S[1][0]) / 2, S[1][1], (S[1][2] + S[2][1]) / 2],
    [(S[0][2] + S[2][0]) / 2, (S[1][2] + S[2][1]) / 2, S[2][2]],
  ];
  return { Q, S };
}

// ---------------------------------------------------------------------------
// quaternions
// ---------------------------------------------------------------------------

export function quatFromRotation(m: Matrix3x3Values): Quat {
  const tr = m[0][0] + m[1][1] + m[2][2];
  let q: Quat;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    q = [s / 4, (m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s];
  } else if (m[0][0] > m[1][1] && m[0][0] > m[2][2]) {
    const s = Math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2;
    q = [(m[2][1] - m[1][2]) / s, s / 4, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s];
  } else if (m[1][1] > m[2][2]) {
    const s = Math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2;
    q = [(m[0][2] - m[2][0]) / s, (m[0][1] + m[1][0]) / s, s / 4, (m[1][2] + m[2][1]) / s];
  } else {
    const s = Math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2;
    q = [(m[1][0] - m[0][1]) / s, (m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, s / 4];
  }
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

export function rotationFromQuat(q: Quat): Matrix3x3Values {
  const [w, x, y, z] = q;
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)],
    [2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)],
    [2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)],
  ];
}

// Shortest-path spherical interpolation.
export function slerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb: Quat = b;
  if (d < 0) {
    bb = [-b[0], -b[1], -b[2], -b[3]];
    d = -d;
  }
  if (d > 0.9995) {
    const l: Quat = [
      a[0] + (bb[0] - a[0]) * t,
      a[1] + (bb[1] - a[1]) * t,
      a[2] + (bb[2] - a[2]) * t,
      a[3] + (bb[3] - a[3]) * t,
    ];
    const n = Math.hypot(l[0], l[1], l[2], l[3]) || 1;
    return [l[0] / n, l[1] / n, l[2] / n, l[3] / n];
  }
  const theta = Math.acos(Math.min(1, d));
  const sinT = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinT;
  const wb = Math.sin(t * theta) / sinT;
  return [
    wa * a[0] + wb * bb[0],
    wa * a[1] + wb * bb[1],
    wa * a[2] + wb * bb[2],
    wa * a[3] + wb * bb[3],
  ];
}
