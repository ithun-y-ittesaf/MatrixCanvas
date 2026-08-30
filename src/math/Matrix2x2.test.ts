import { describe, it, expect } from 'vitest';
import { Matrix2x2 } from './Matrix2x2';

function expectClose(a: number, b: number, eps = 1e-9) {
  expect(Math.abs(a - b)).toBeLessThan(eps);
}

describe('Matrix2x2.interpolateDecomposed', () => {
  it('passes through a 90° rotation at t=0.5 when animating identity -> 180°', () => {
    const identity = Matrix2x2.identity();
    const rotation180 = new Matrix2x2([[-1, 0], [0, -1]]);

    const mid = identity.interpolateDecomposed(rotation180, 0.5);

    // At exactly 180°, +90° and -90° are equally "shortest path" — either is a
    // valid midpoint. What matters is it's a proper 90° rotation (unit length,
    // zero trace, det=1), not the degenerate zero matrix naive lerp produces.
    expectClose(mid.a, 0);
    expectClose(mid.d, 0);
    expectClose(Math.abs(mid.b), 1);
    expectClose(Math.abs(mid.c), 1);
    expectClose(mid.b, -mid.c);
    expectClose(mid.a * mid.d - mid.b * mid.c, 1);
  });

  it('matches identity at t=0 and the target at t=1', () => {
    const identity = Matrix2x2.identity();
    const rotation180 = new Matrix2x2([[-1, 0], [0, -1]]);

    const start = identity.interpolateDecomposed(rotation180, 0);
    expectClose(start.a, 1);
    expectClose(start.b, 0);
    expectClose(start.c, 0);
    expectClose(start.d, 1);

    const end = identity.interpolateDecomposed(rotation180, 1);
    expectClose(end.a, -1);
    expectClose(end.b, 0);
    expectClose(end.c, 0);
    expectClose(end.d, -1);
  });

  it('interpolates pure scale matrices linearly, same as naive lerp', () => {
    const identity = Matrix2x2.identity();
    const scale2x = new Matrix2x2([[2, 0], [0, 2]]);

    const mid = identity.interpolateDecomposed(scale2x, 0.5);

    expectClose(mid.a, 1.5);
    expectClose(mid.b, 0);
    expectClose(mid.c, 0);
    expectClose(mid.d, 1.5);
  });

  it('takes the shorter path for a -90° rotation rather than going the long way', () => {
    const identity = Matrix2x2.identity();
    const rotationNeg90 = new Matrix2x2([[0, 1], [-1, 0]]);

    const mid = identity.interpolateDecomposed(rotationNeg90, 0.5);

    // Shortest path from 0 to -90° passes through -45°.
    const expectedAngle = -Math.PI / 4;
    expectClose(mid.a, Math.cos(expectedAngle));
    expectClose(mid.b, -Math.sin(expectedAngle));
    expectClose(mid.c, Math.sin(expectedAngle));
    expectClose(mid.d, Math.cos(expectedAngle));
  });
});

describe('Matrix2x2.eigenvalues', () => {
  it('returns real eigenvalues when the discriminant is non-negative', () => {
    const m = new Matrix2x2([[2, 0], [0, 3]]);
    const result = m.eigenvalues();
    expect(result.type).toBe('real');
    if (result.type === 'real') {
      expectClose(result.values[0], 3);
      expectClose(result.values[1], 2);
    }
  });

  it('returns a complex-conjugate pair instead of null when the discriminant is negative', () => {
    // A 90° rotation: trace 0, det 1, discriminant -4 -> eigenvalues ±i.
    const rotation90 = new Matrix2x2([[0, -1], [1, 0]]);
    const result = rotation90.eigenvalues();
    expect(result.type).toBe('complex');
    if (result.type === 'complex') {
      expectClose(result.values[0].re, 0);
      expectClose(result.values[1].re, 0);
      expectClose(result.values[0].im, 1);
      expectClose(result.values[1].im, -1);
    }
  });
});

describe('Matrix2x2.singularValues', () => {
  it('matches the diagonal entries (sorted) for a diagonal scale matrix', () => {
    const m = new Matrix2x2([[3, 0], [0, 5]]);
    const [s1, s2] = m.singularValues();
    expectClose(s1, 5);
    expectClose(s2, 3);
  });

  it('is 1, 1 for a pure rotation (rotations preserve length in every direction)', () => {
    const rotation = new Matrix2x2([[0, -1], [1, 0]]);
    const [s1, s2] = rotation.singularValues();
    expectClose(s1, 1);
    expectClose(s2, 1);
  });

  it('has a zero second singular value for a rank-1 (singular) matrix', () => {
    const m = new Matrix2x2([[1, 2], [2, 4]]);
    const [s1, s2] = m.singularValues();
    expectClose(s2, 0);
    expectClose(s1 * s1, 1 + 4 + 4 + 16); // s1 == Frobenius norm when s2 == 0
  });

  it('has product equal to |det| and sum of squares equal to the squared Frobenius norm', () => {
    const m = new Matrix2x2([[1, 2], [3, 4]]);
    const [s1, s2] = m.singularValues();
    expectClose(s1 * s2, Math.abs(m.determinant()));
    expectClose(s1 * s1 + s2 * s2, 1 + 4 + 9 + 16);
  });
});