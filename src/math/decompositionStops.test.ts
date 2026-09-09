import { describe, it, expect } from 'vitest';
import { Matrix2x2, type Matrix2x2Values } from './Matrix2x2';
import { svdStops } from './decompositionStops';

// NFR-5: accurate to at least 6 decimal places.
const TOL = 1e-6;

const IDENTITY: Matrix2x2Values = [[1, 0], [0, 1]];

function expectMatrixClose(actual: Matrix2x2Values, expected: Matrix2x2Values, tol = TOL) {
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      expect(
        Math.abs(actual[i][j] - expected[i][j]),
        `entry [${i}][${j}]: got ${actual[i][j]}, want ${expected[i][j]}`,
      ).toBeLessThan(tol);
    }
  }
}

function isFiniteMatrix(m: Matrix2x2Values): boolean {
  return m.flat().every((x) => Number.isFinite(x));
}

// identity, a rotation, a shear, a symmetric matrix, a singular (rank-deficient)
// matrix, plus a non-symmetric matrix with distinct real eigenvalues.
const MATRICES: Record<string, Matrix2x2Values> = {
  identity: [[1, 0], [0, 1]],
  rotation: [[Math.cos(0.6), -Math.sin(0.6)], [Math.sin(0.6), Math.cos(0.6)]],
  shear: [[1, 1.5], [0, 1]],
  symmetric: [[2, 1], [1, 3]],
  singular: [[1, 2], [2, 4]],
  distinctReal: [[3, 1], [0, 2]],
};

describe('svdStops', () => {
  for (const [name, values] of Object.entries(MATRICES)) {
    it(`${name}: identity -> V^T -> Sigma*V^T -> A (4 stops)`, () => {
      const stops = svdStops(values);
      expect(stops).toHaveLength(4);
      expect(stops.every(isFiniteMatrix)).toBe(true);
      expectMatrixClose(stops[0], IDENTITY);
      expectMatrixClose(stops[stops.length - 1], values);

      // Stop 1 is an orthogonal matrix (V^T).
      expect(new Matrix2x2(stops[1]).isOrthogonal()).toBe(true);
    });
  }

  it('accepts a Matrix2x2 instance and raw values interchangeably', () => {
    const values: Matrix2x2Values = [[2, 1], [0, 3]];
    const fromRaw = svdStops(values);
    const fromInstance = svdStops(new Matrix2x2(values));
    fromRaw.forEach((stop, i) => expectMatrixClose(stop, fromInstance[i]));
  });
});
