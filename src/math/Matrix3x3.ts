import type { Complex } from './Matrix2x2';
import {
  type Vec3,
  column3,
  lerpMatrix3,
  matmul3,
  polar3,
  quatFromRotation,
  rotationFromQuat,
  slerp,
  svd3,
  symmetricEigen3,
  transpose3,
} from './linalg3';

export type Matrix3x3Values = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];

// A real 3x3's characteristic cubic always has either three real roots or one
// real root plus a complex-conjugate pair — never two independent complex
// pairs — so the "mixed" case is exactly one real value alongside the pair
// (unlike Matrix2x2's EigenvaluePair, which is either-or across two values).
export type EigenvaluePair3 =
  | { type: 'real'; values: [number, number, number] }
  | { type: 'mixed'; values: [number, Complex, Complex] };

function cbrt(x: number): number {
  return Math.sign(x) * Math.pow(Math.abs(x), 1 / 3);
}

export class Matrix3x3 {
  readonly values: Matrix3x3Values;

  constructor(values: Matrix3x3Values = Matrix3x3.identityValues()) {
    this.values = values;
  }

  static identityValues(): Matrix3x3Values {
    return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  }

  static identity(): Matrix3x3 {
    return new Matrix3x3(Matrix3x3.identityValues());
  }

  multiply(v: [number, number, number]): [number, number, number] {
    const m = this.values;
    return [
      m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
      m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
      m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
    ];
  }

  determinant(): number {
    const m = this.values;
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  }

  trace(): number {
    const m = this.values;
    return m[0][0] + m[1][1] + m[2][2];
  }

  inverse(): Matrix3x3 | null {
    const det = this.determinant();
    if (Math.abs(det) < 1e-9) return null;
    const m = this.values;
    // Adjugate (transpose of the cofactor matrix), divided by the determinant.
    const cof: Matrix3x3Values = [
      [
        m[1][1] * m[2][2] - m[1][2] * m[2][1],
        m[0][2] * m[2][1] - m[0][1] * m[2][2],
        m[0][1] * m[1][2] - m[0][2] * m[1][1],
      ],
      [
        m[1][2] * m[2][0] - m[1][0] * m[2][2],
        m[0][0] * m[2][2] - m[0][2] * m[2][0],
        m[0][2] * m[1][0] - m[0][0] * m[1][2],
      ],
      [
        m[1][0] * m[2][1] - m[1][1] * m[2][0],
        m[0][1] * m[2][0] - m[0][0] * m[2][1],
        m[0][0] * m[1][1] - m[0][1] * m[1][0],
      ],
    ];
    return new Matrix3x3(cof.map((row) => row.map((x) => x / det)) as Matrix3x3Values);
  }

  // Roots of the characteristic cubic λ³ - tr·λ² + c2·λ - det = 0, where c2 is
  // the sum of the three principal 2x2 minors (the trace of the adjugate).
  // Solved via the standard depressed-cubic (Cardano/trigonometric) method:
  // substituting λ = t - B/3 turns it into t³ + pt + q = 0, whose discriminant
  // Δ = (q/2)² + (p/3)³ tells us whether the roots are three-real (Δ<0, solved
  // trigonometrically to avoid complex intermediates) or one-real-plus-a-
  // conjugate-pair (Δ>0, solved with Cardano's formula directly).
  eigenvalues(): EigenvaluePair3 {
    const m = this.values;
    const B = -this.trace();
    const C =
      (m[0][0] * m[1][1] - m[0][1] * m[1][0]) +
      (m[0][0] * m[2][2] - m[0][2] * m[2][0]) +
      (m[1][1] * m[2][2] - m[1][2] * m[2][1]);
    const D = -this.determinant();

    // Depress: λ = t - B/3
    const p = C - (B * B) / 3;
    const q = (2 * B * B * B) / 27 - (B * C) / 3 + D;
    const shift = (t: number) => t - B / 3;

    const disc = (q * q) / 4 + (p * p * p) / 27;
    const eps = 1e-9;

    if (disc > eps) {
      const sqrtDisc = Math.sqrt(disc);
      const u = cbrt(-q / 2 + sqrtDisc);
      const v = cbrt(-q / 2 - sqrtDisc);
      const real = shift(u + v);
      const re = shift(-(u + v) / 2);
      const im = ((u - v) * Math.sqrt(3)) / 2;
      return { type: 'mixed', values: [real, { re, im }, { re, im: -im }] };
    }

    if (disc < -eps) {
      const r = 2 * Math.sqrt(-p / 3);
      const phi = Math.acos(Math.min(1, Math.max(-1, (3 * q) / (p * r))) ) / 3;
      const roots: [number, number, number] = [
        shift(r * Math.cos(phi)),
        shift(r * Math.cos(phi - (2 * Math.PI) / 3)),
        shift(r * Math.cos(phi - (4 * Math.PI) / 3)),
      ];
      return { type: 'real', values: roots };
    }

    // disc ~ 0: a repeated root (still real).
    const u = cbrt(-q / 2);
    const roots: [number, number, number] = [shift(2 * u), shift(-u), shift(-u)];
    return { type: 'real', values: roots };
  }

  // this * other (matrix product). `multiply` is the matrix-times-vector form,
  // matching Matrix2x2's naming.
  multiplyMatrix(other: Matrix3x3 | Matrix3x3Values): Matrix3x3 {
    const o = other instanceof Matrix3x3 ? other.values : other;
    return new Matrix3x3(matmul3(this.values, o));
  }

  transpose(): Matrix3x3 {
    return new Matrix3x3(transpose3(this.values));
  }

  // Singular values, largest first.
  singularValues(): Vec3 {
    return svd3(this.values).sigma;
  }

  rank(): number {
    const sigma = this.singularValues();
    const cutoff = 1e-9 * Math.max(1, sigma[0]);
    return sigma.filter((s) => s > cutoff).length;
  }

  isInvertible(): boolean {
    return Math.abs(this.determinant()) > 1e-9;
  }

  isOrthogonal(): boolean {
    const p = matmul3(transpose3(this.values), this.values);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (Math.abs(p[r][c] - (r === c ? 1 : 0)) > 1e-6) return false;
      }
    }
    return true;
  }

  isSymmetric(): boolean {
    const m = this.values;
    return (
      Math.abs(m[0][1] - m[1][0]) < 1e-9 &&
      Math.abs(m[0][2] - m[2][0]) < 1e-9 &&
      Math.abs(m[1][2] - m[2][1]) < 1e-9
    );
  }

  // Orthonormal basis of the null space {x : this*x = 0} - 0 to 3 vectors
  // (0 for an invertible matrix, 3 for the zero matrix). `tol` is the largest
  // singular value still treated as zero.
  nullSpaceBasis(tol = 1e-7): Vec3[] {
    const scaleRef = Math.max(1, this.singularValues()[0]);
    const { values, vectors } = symmetricEigen3(matmul3(transpose3(this.values), this.values));
    const basis: Vec3[] = [];
    for (let i = 0; i < 3; i++) {
      if (Math.sqrt(Math.max(values[i], 0)) <= tol * scaleRef) basis.push(column3(vectors, i));
    }
    return basis;
  }

  // Orthonormal basis of the column space (the image of the transform) - `rank`
  // vectors.
  columnSpaceBasis(): Vec3[] {
    const { U, sigma } = svd3(this.values);
    const cutoff = 1e-9 * Math.max(1, sigma[0]);
    const basis: Vec3[] = [];
    for (let i = 0; i < 3; i++) if (sigma[i] > cutoff) basis.push(column3(U, i));
    return basis;
  }

  // Real eigenpairs: for each real eigenvalue, an orthonormal basis of its
  // eigenspace (a repeated eigenvalue can contribute several vectors, or fewer
  // than its multiplicity if the matrix is defective). Complex eigenvalues have
  // no real eigenvector and are skipped. The tolerance is generous because the
  // closed-form cubic in `eigenvalues` loses precision near repeated roots.
  eigenvectors(): { value: number; vector: Vec3 }[] {
    const spectrum = this.eigenvalues();
    const reals = spectrum.type === 'real' ? [...spectrum.values] : [spectrum.values[0]];
    reals.sort((a, b) => b - a);

    // Cluster (near-)equal eigenvalues so each eigenspace is found once.
    const clusters: { value: number; count: number }[] = [];
    for (const v of reals) {
      const last = clusters[clusters.length - 1];
      if (last && Math.abs(last.value / last.count - v) < 1e-4 * Math.max(1, Math.abs(v))) {
        last.value += v;
        last.count += 1;
      } else {
        clusters.push({ value: v, count: 1 });
      }
    }

    const out: { value: number; vector: Vec3 }[] = [];
    for (const { value, count } of clusters) {
      const lambda = value / count;
      const shifted = new Matrix3x3([
        [this.values[0][0] - lambda, this.values[0][1], this.values[0][2]],
        [this.values[1][0], this.values[1][1] - lambda, this.values[1][2]],
        [this.values[2][0], this.values[2][1], this.values[2][2] - lambda],
      ]);
      const basis = shifted.nullSpaceBasis(1e-4).slice(0, count);
      for (const vector of basis) out.push({ value: lambda, vector });
    }
    return out;
  }

  lerp(target: Matrix3x3, t: number): Matrix3x3 {
    return new Matrix3x3(lerpMatrix3(this.values, target.values, t));
  }

  // Interpolates toward `target` via polar decomposition (M = Q*S): the
  // rotation parts are slerped along the shortest arc and the symmetric parts
  // lerped. Like Matrix2x2.interpolateDecomposed, this avoids `lerp`'s
  // shrink-through-zero when animating rotations.
  interpolateDecomposed(target: Matrix3x3, t: number): Matrix3x3 {
    const from = polar3(this.values);
    const to = polar3(target.values);
    const q = slerp(quatFromRotation(from.Q), quatFromRotation(to.Q), t);
    const s = lerpMatrix3(from.S, to.S, t);
    return new Matrix3x3(matmul3(rotationFromQuat(q), s));
  }
}
