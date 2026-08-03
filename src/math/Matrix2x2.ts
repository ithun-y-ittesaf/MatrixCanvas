export type Matrix2x2Values = [[number, number], [number, number]];

export class Matrix2x2 {
  readonly values: Matrix2x2Values;

  constructor(values: Matrix2x2Values = [[1, 0], [0, 1]]) {
    this.values = values;
  }

  get a() { return this.values[0][0]; }
  get b() { return this.values[0][1]; }
  get c() { return this.values[1][0]; }
  get d() { return this.values[1][1]; }

  multiply(v: [number, number]): [number, number] {
    return [
      this.a * v[0] + this.b * v[1],
      this.c * v[0] + this.d * v[1],
    ];
  }

  determinant(): number {
    return this.a * this.d - this.b * this.c;
  }

  trace(): number {
    return this.a + this.d;
  }

  rank(): number {
    if (Math.abs(this.determinant()) > 1e-9) return 2;
    if (
      Math.abs(this.a) > 1e-9 || Math.abs(this.b) > 1e-9 ||
      Math.abs(this.c) > 1e-9 || Math.abs(this.d) > 1e-9
    ) return 1;
    return 0;
  }

  isInvertible(): boolean {
    return Math.abs(this.determinant()) > 1e-9;
  }

  isOrthogonal(): boolean {
    const eps = 1e-6;
    return (
      Math.abs(this.a * this.a + this.c * this.c - 1) < eps &&
      Math.abs(this.b * this.b + this.d * this.d - 1) < eps &&
      Math.abs(this.a * this.b + this.c * this.d) < eps
    );
  }

  isSymmetric(): boolean {
    return Math.abs(this.b - this.c) < 1e-9;
  }

  // Returns real eigenvalues or null if complex
  eigenvalues(): [number, number] | null {
    const tr = this.trace();
    const det = this.determinant();
    const disc = tr * tr - 4 * det;
    if (disc < 0) return null;
    const sq = Math.sqrt(disc);
    return [(tr + sq) / 2, (tr - sq) / 2];
  }

  inverse(): Matrix2x2 | null {
    const det = this.determinant();
    if (Math.abs(det) < 1e-9) return null;
    return new Matrix2x2([
      [ this.d / det, -this.b / det],
      [-this.c / det,  this.a / det],
    ]);
  }

  lerp(target: Matrix2x2, t: number): Matrix2x2 {
    const l = (x: number, y: number) => x + (y - x) * t;
    return new Matrix2x2([
      [l(this.a, target.a), l(this.b, target.b)],
      [l(this.c, target.c), l(this.d, target.d)],
    ]);
  }

  // Polar decomposition M = R * S (R rotation, S symmetric). atan2(c - b, a + d)
  // is the closed-form rotation angle of R for any 2x2 M; S = R^T * M then falls
  // out symmetric by construction, recovering M exactly when recomposed.
  private polarDecompose(): { angle: number; s00: number; s01: number; s11: number } {
    const { a, b, c, d } = this;
    const angle = Math.atan2(c - b, a + d);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const s00 = cos * a + sin * c;
    const s01 = cos * b + sin * d;
    const s10 = -sin * a + cos * c;
    const s11 = -sin * b + cos * d;
    return { angle, s00, s01: (s01 + s10) / 2, s11 };
  }

  // Interpolates toward `target` by decomposing both matrices into rotation +
  // symmetric scale/shear, taking the shortest-path angle and lerping the scale
  // part. Avoids `lerp`'s degenerate shrink-through-zero when animating rotations
  // (e.g. identity -> 180° passes through a proper 90° rotation, not a flat matrix).
  interpolateDecomposed(target: Matrix2x2, t: number): Matrix2x2 {
    const from = this.polarDecompose();
    const to = target.polarDecompose();

    const twoPi = Math.PI * 2;
    let delta = to.angle - from.angle;
    delta = ((delta + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
    const angle = from.angle + delta * t;

    const l = (x: number, y: number) => x + (y - x) * t;
    const s00 = l(from.s00, to.s00);
    const s01 = l(from.s01, to.s01);
    const s11 = l(from.s11, to.s11);

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Matrix2x2([
      [cos * s00 - sin * s01, cos * s01 - sin * s11],
      [sin * s00 + cos * s01, sin * s01 + cos * s11],
    ]);
  }

  static identity(): Matrix2x2 {
    return new Matrix2x2([[1, 0], [0, 1]]);
  }
}
