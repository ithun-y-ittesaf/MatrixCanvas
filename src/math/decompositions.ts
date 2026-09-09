// 2x2 matrix decompositions (SVD, LU, QR, eigen), built on the `mathjs`
// package for the parts that benefit from a vetted implementation (the
// symmetric eigensolver behind SVD, vector primitives for Gram-Schmidt) and
// on closed-form 2x2 algebra where that is both clearer and exact.
//
// Every function accepts either a `Matrix2x2` or its raw `Matrix2x2Values` and
// returns `Matrix2x2` instances. Each decomposition satisfies a reconstruction
// identity (A = U*Sigma*V^T, A = L*U, A = Q*R, A = P*D*P^-1) to within the
// project's NFR-5 tolerance of 6 decimal places; see decompositions.test.ts.

import { eigs, multiply, transpose, dot, norm } from 'mathjs';
import { Matrix2x2, type Matrix2x2Values } from './Matrix2x2';

export type Matrix2x2Input = Matrix2x2 | Matrix2x2Values;

// Entries below this magnitude are treated as zero. Matches the 1e-9 threshold
// Matrix2x2 already uses for singularity/rank decisions.
const EPS = 1e-9;

type Vec = [number, number];

function coerce(input: Matrix2x2Input): Matrix2x2 {
  return input instanceof Matrix2x2 ? input : new Matrix2x2(input);
}

// mathjs types `eigs` loosely (values/vectors can be arrays, matrices, complex,
// or bignumbers depending on input). We only ever feed it a real symmetric 2x2,
// whose spectrum is real, so a narrow local shape plus these coercions is safe.
interface EigsResult {
  values: unknown[];
  eigenvectors: { value: unknown; vector: unknown }[];
}

function asVec2(x: unknown): Vec {
  const arr = Array.isArray(x)
    ? x
    : (x as { toArray(): unknown[] }).toArray();
  return [Number(arr[0]), Number(arr[1])];
}

// ---------------------------------------------------------------------------
// SVD  —  A = U * Sigma * V^T
// ---------------------------------------------------------------------------

// V comes from the eigenvectors of the symmetric PSD matrix A^T*A (mathjs
// `eigs`); the singular values come from Matrix2x2.singularValues() (already
// derived in closed form there, and clamped to be non-negative). Each U column
// is A*v_i renormalised to unit length rather than divided by sigma_i — that
// keeps U orthonormal even when the two sources round sigma slightly
// differently, and it is well defined for every non-degenerate direction. A
// zero singular value contributes no constraint on its U column, so that column
// is filled with the orthogonal complement of the other one; U is then flipped
// (column 2 and the matching V column together, which leaves the product
// unchanged) to be a proper rotation for a deterministic result.
export function svd(input: Matrix2x2Input): {
  U: Matrix2x2;
  Sigma: Matrix2x2;
  V: Matrix2x2;
} {
  const m = coerce(input);
  const [sigma1, sigma2] = m.singularValues(); // largest first, >= 0

  // Zero matrix: every direction is a null direction; any orthonormal U, V work.
  if (sigma1 <= EPS) {
    return {
      U: Matrix2x2.identity(),
      Sigma: new Matrix2x2([[0, 0], [0, 0]]),
      V: Matrix2x2.identity(),
    };
  }

  const ata = multiply(transpose(m.values), m.values) as number[][];
  const e = eigs(ata) as unknown as EigsResult;
  const pairs = e.eigenvectors
    .map((ev) => ({ value: Math.max(Number(ev.value), 0), vec: asVec2(ev.vector) }))
    .sort((p, q) => q.value - p.value); // eigenvalue descending -> matches sigma order

  const v1 = pairs[0].vec;
  const v2 = pairs[1].vec;

  const u1 = normalize(m.multiply(v1)) ?? [1, 0];
  let u2: Vec;
  if (sigma2 <= EPS) {
    u2 = [-u1[1], u1[0]]; // orthogonal complement; A has no rank-2 component here
  } else {
    u2 = normalize(m.multiply(v2)) ?? [-u1[1], u1[0]];
  }

  let uCols: [Vec, Vec] = [u1, u2];
  let vCols: [Vec, Vec] = [v1, v2];
  if (det(uCols) < 0) {
    uCols = [u1, [-u2[0], -u2[1]]];
    vCols = [v1, [-v2[0], -v2[1]]];
  }

  return {
    U: fromColumns(uCols[0], uCols[1]),
    Sigma: new Matrix2x2([[sigma1, 0], [0, sigma2]]),
    V: fromColumns(vCols[0], vCols[1]),
  };
}

// ---------------------------------------------------------------------------
// LU  —  A = L * U  (Doolittle, no pivoting)
// ---------------------------------------------------------------------------

// The only obstruction to an unpivoted LU of a 2x2 is a zero pivot in the top-
// left entry, in which case we return null (the caller can fall back to a
// pivoting solver). Otherwise the factorisation is a one-step elimination and
// is exact up to floating-point round-off.
export function luDecompose(
  input: Matrix2x2Input,
): { L: Matrix2x2; U: Matrix2x2 } | null {
  const { a, b, c, d } = coerce(input);
  if (Math.abs(a) <= EPS) return null;

  const l21 = c / a;
  const u22 = d - l21 * b;
  return {
    L: new Matrix2x2([[1, 0], [l21, 1]]),
    U: new Matrix2x2([[a, b], [0, u22]]),
  };
}

// ---------------------------------------------------------------------------
// QR  —  A = Q * R  (classical Gram-Schmidt on the columns)
// ---------------------------------------------------------------------------

// Orthonormalise the columns [a1 a2] of A: e1 is a1 normalised, e2 is what
// remains of a2 after removing its e1 component, normalised. R is upper
// triangular with the projection coefficients. A degenerate column (zero, or
// parallel to the first) leaves a zero on R's diagonal and its Q column is
// filled with a unit vector orthogonal to the other, so Q stays orthonormal and
// Q*R still reproduces A.
export function qrDecompose(input: Matrix2x2Input): { Q: Matrix2x2; R: Matrix2x2 } {
  const m = coerce(input);
  const a1: Vec = [m.a, m.c];
  const a2: Vec = [m.b, m.d];

  const n1 = norm(a1) as number;
  const e1: Vec = n1 > EPS ? [a1[0] / n1, a1[1] / n1] : [1, 0];
  const r11 = n1 > EPS ? n1 : 0;

  const r12 = dot(a2, e1) as number;
  const u2: Vec = [a2[0] - r12 * e1[0], a2[1] - r12 * e1[1]];
  const n2 = norm(u2) as number;
  const e2: Vec = n2 > EPS ? [u2[0] / n2, u2[1] / n2] : [-e1[1], e1[0]];
  const r22 = n2 > EPS ? n2 : 0;

  return {
    Q: fromColumns(e1, e2),
    R: new Matrix2x2([[r11, r12], [0, r22]]),
  };
}

// ---------------------------------------------------------------------------
// Eigendecomposition  —  A = P * D * P^-1
// ---------------------------------------------------------------------------

// Eigenvalues are taken from Matrix2x2.eigenvalues() rather than recomputed
// here. Returns null when they are a complex-conjugate pair, and when they are
// a real repeated value whose eigenspace is only 1-dimensional (a defective
// matrix such as a shear) — neither case is diagonalisable over the reals. A
// repeated eigenvalue with A - lambda*I == 0 is already diagonal and is
// returned as such.
export function eigenDecompose(
  input: Matrix2x2Input,
): { P: Matrix2x2; D: Matrix2x2; Pinv: Matrix2x2 } | null {
  const m = coerce(input);
  const spectrum = m.eigenvalues();
  if (spectrum.type === 'complex') return null;

  const [lambda1, lambda2] = spectrum.values;
  const D = new Matrix2x2([[lambda1, 0], [0, lambda2]]);

  if (Math.abs(lambda1 - lambda2) <= EPS) {
    const residual = Math.max(
      Math.abs(m.a - lambda1), Math.abs(m.b),
      Math.abs(m.c), Math.abs(m.d - lambda1),
    );
    if (residual > EPS) return null; // defective: geometric multiplicity 1
    return { P: Matrix2x2.identity(), D, Pinv: Matrix2x2.identity() };
  }

  const P = fromColumns(eigenvector(m, lambda1), eigenvector(m, lambda2));
  const Pinv = P.inverse();
  if (!Pinv) return null; // eigenvectors dependent (shouldn't happen for distinct lambda)
  return { P, D, Pinv };
}

// Unit null-vector of (A - lambda*I). Row 1 of that matrix is orthogonal to
// [b, lambda - a] and row 2 to [lambda - d, c]; for an actual eigenvalue either
// candidate spans the eigenspace, so we take whichever is better conditioned.
function eigenvector(m: Matrix2x2, lambda: number): Vec {
  const cand1: Vec = [m.b, lambda - m.a];
  const cand2: Vec = [lambda - m.d, m.c];
  const v = (norm(cand1) as number) >= (norm(cand2) as number) ? cand1 : cand2;
  return normalize(v) ?? [1, 0]; // A - lambda*I == 0: any unit vector serves
}

// ---------------------------------------------------------------------------
// small shared helpers
// ---------------------------------------------------------------------------

function normalize(v: Vec): Vec | null {
  const n = Math.hypot(v[0], v[1]);
  return n <= EPS ? null : [v[0] / n, v[1] / n];
}

function fromColumns(c0: Vec, c1: Vec): Matrix2x2 {
  return new Matrix2x2([[c0[0], c1[0]], [c0[1], c1[1]]]);
}

function det([c0, c1]: [Vec, Vec]): number {
  return c0[0] * c1[1] - c1[0] * c0[1];
}
