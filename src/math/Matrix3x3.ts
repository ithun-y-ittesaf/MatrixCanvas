import type { Complex } from './Matrix2x2';

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
}
