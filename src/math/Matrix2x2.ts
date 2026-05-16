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

  static identity(): Matrix2x2 {
    return new Matrix2x2([[1, 0], [0, 1]]);
  }
}
