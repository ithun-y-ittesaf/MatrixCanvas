import { describe, it, expect } from 'vitest';
import { Matrix2x2, type Matrix2x2Values } from './Matrix2x2';
import { svd, luDecompose, qrDecompose, eigenDecompose } from './decompositions';

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

describe('luDecompose: A = L * U (no pivoting)', () => {
  for (const [name, values] of Object.entries(MATRICES)) {
    it(`reconstructs ${name}`, () => {
      const result = luDecompose(values);
      expect(result).not.toBeNull();
      const { L, U } = result!;
      expectMatrixClose(mul(L, U), values);

      // L is unit lower-triangular, U is upper-triangular.
      expect(L.a).toBe(1);
      expect(L.d).toBe(1);
      expect(L.b).toBe(0);
      expect(Math.abs(U.c)).toBeLessThan(TOL);
    });
  }

  it('returns null when the top-left pivot is zero', () => {
    expect(luDecompose([[0, 1], [1, 0]])).toBeNull();
    expect(luDecompose([[0, 2], [3, 4]])).toBeNull();
  });

  it('accepts a Matrix2x2 instance as well as raw values', () => {
    const fromInstance = luDecompose(new Matrix2x2([[2, 1], [4, 3]]));
    expect(fromInstance).not.toBeNull();
    expectMatrixClose(mul(fromInstance!.L, fromInstance!.U), [[2, 1], [4, 3]]);
  });
});

describe('qrDecompose: A = Q * R (Gram-Schmidt)', () => {
  for (const [name, values] of Object.entries(MATRICES)) {
    it(`reconstructs ${name}`, () => {
      const { Q, R } = qrDecompose(values);
      expectMatrixClose(mul(Q, R), values);

      // Q is orthogonal, R is upper-triangular.
      expect(Q.isOrthogonal()).toBe(true);
      expect(Math.abs(R.c)).toBeLessThan(TOL);
    });
  }

  it('handles a rank-deficient matrix (second column parallel to the first)', () => {
    const { Q, R } = qrDecompose([[1, 2], [2, 4]]);
    expectMatrixClose(mul(Q, R), [[1, 2], [2, 4]]);
    expect(Q.isOrthogonal()).toBe(true);
    expect(Math.abs(R.d)).toBeLessThan(TOL); // trailing R entry collapses to 0
  });
});

describe('eigenDecompose: A = P * D * P^-1', () => {
  const diagonalisable = ['identity', 'symmetric', 'singular', 'distinctReal'];
  for (const name of diagonalisable) {
    it(`reconstructs ${name}`, () => {
      const values = MATRICES[name];
      const result = eigenDecompose(values);
      expect(result).not.toBeNull();
      const { P, D, Pinv } = result!;
      expectMatrixClose(mul(mul(P, D), Pinv), values);

      // D is diagonal, and P * Pinv is the identity.
      expect(Math.abs(D.b)).toBeLessThan(TOL);
      expect(Math.abs(D.c)).toBeLessThan(TOL);
      expectMatrixClose(mul(P, Pinv), [[1, 0], [0, 1]]);

      // Diagonal of D holds the eigenvalues from Matrix2x2.eigenvalues().
      const spectrum = new Matrix2x2(values).eigenvalues();
      expect(spectrum.type).toBe('real');
      if (spectrum.type === 'real') {
        expect(Math.abs(D.a - spectrum.values[0])).toBeLessThan(TOL);
        expect(Math.abs(D.d - spectrum.values[1])).toBeLessThan(TOL);
      }
    });
  }

  it('returns null for a rotation (complex eigenvalues)', () => {
    expect(eigenDecompose(MATRICES.rotation)).toBeNull();
    expect(eigenDecompose([[0, -1], [1, 0]])).toBeNull();
  });

  it('returns null for a defective matrix (shear: repeated eigenvalue, 1-D eigenspace)', () => {
    expect(eigenDecompose(MATRICES.shear)).toBeNull();
    expect(eigenDecompose([[3, 1], [0, 3]])).toBeNull();
  });
});
