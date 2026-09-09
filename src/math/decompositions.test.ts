import { describe, it, expect } from 'vitest';
import { Matrix2x2, type Matrix2x2Values } from './Matrix2x2';
import { svd } from './decompositions';

// NFR-5: results accurate to at least 6 decimal places. Every reconstruction
// identity below is asserted to hold within this tolerance.
const TOL = 1e-6;

function mul(x: Matrix2x2, y: Matrix2x2): Matrix2x2 {
  const [c00, c10] = x.multiply([y.a, y.c]);
  const [c01, c11] = x.multiply([y.b, y.d]);
  return new Matrix2x2([[c00, c01], [c10, c11]]);
}

function transpose(m: Matrix2x2): Matrix2x2 {
  return new Matrix2x2([[m.a, m.c], [m.b, m.d]]);
}

function expectMatrixClose(actual: Matrix2x2, expected: Matrix2x2Values, tol = TOL) {
  const a = actual.values;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      expect(
        Math.abs(a[i][j] - expected[i][j]),
        `entry [${i}][${j}]: got ${a[i][j]}, want ${expected[i][j]}`,
      ).toBeLessThan(tol);
    }
  }
}

// The spanning set required by the prompt: identity, a rotation, a shear, a
// symmetric matrix, and a singular (rank-deficient) matrix. Plus one
// non-symmetric matrix with distinct real eigenvalues.
const MATRICES: Record<string, Matrix2x2Values> = {
  identity: [[1, 0], [0, 1]],
  rotation: [[Math.cos(0.6), -Math.sin(0.6)], [Math.sin(0.6), Math.cos(0.6)]],
  shear: [[1, 1.5], [0, 1]],
  symmetric: [[2, 1], [1, 3]],
  singular: [[1, 2], [2, 4]],
  distinctReal: [[3, 1], [0, 2]],
};

describe('svd: A = U * Sigma * V^T', () => {
  for (const [name, values] of Object.entries(MATRICES)) {
    it(`reconstructs ${name}`, () => {
      const A = new Matrix2x2(values);
      const { U, Sigma, V } = svd(A);
      expectMatrixClose(mul(mul(U, Sigma), transpose(V)), values);

      // Sigma is diagonal, non-negative, and ordered largest-first.
      expect(Math.abs(Sigma.b)).toBeLessThan(TOL);
      expect(Math.abs(Sigma.c)).toBeLessThan(TOL);
      expect(Sigma.a).toBeGreaterThanOrEqual(-TOL);
      expect(Sigma.d).toBeGreaterThanOrEqual(-TOL);
      expect(Sigma.a + TOL).toBeGreaterThanOrEqual(Sigma.d);

      // U and V are orthogonal.
      expect(U.isOrthogonal()).toBe(true);
      expect(V.isOrthogonal()).toBe(true);
    });
  }

  it('accepts raw values as well as a Matrix2x2 instance', () => {
    const { U, Sigma, V } = svd([[2, 0], [0, 3]]);
    expectMatrixClose(mul(mul(U, Sigma), transpose(V)), [[2, 0], [0, 3]]);
  });
});
