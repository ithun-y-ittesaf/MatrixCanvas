import { describe, it, expect } from 'vitest';
import { Matrix3x3, type Matrix3x3Values } from './Matrix3x3';
import {
  svd3d,
  luDecompose3,
  qrDecompose3,
  eigenDecompose3,
} from './decompositions3d';
import { svdStops3d, eigenStops3d, luStops3d, qrStops3d } from './decompositionStops3d';
import { buildDecompositionSequence3d } from './decompositionSequences3d';
import { matmul3, det3 } from './linalg3';

function expectMatrixClose(a: Matrix3x3Values, b: Matrix3x3Values, eps = 1e-6) {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      expect(Math.abs(a[r][c] - b[r][c])).toBeLessThan(eps);
    }
  }
}

const I: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const SAMPLES: Record<string, Matrix3x3Values> = {
  general: [[2, 1, 0], [0, 1, 3], [1, 0, 1]],
  symmetric: [[4, 1, 2], [1, 3, 0], [2, 0, 5]],
  diagonal: [[3, 0, 0], [0, 2, 0], [0, 0, 1]],
  rotation: [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
  rank2: [[1, 2, 3], [2, 4, 6], [1, 0, 1]],
  rank1: [[1, 2, 3], [2, 4, 6], [3, 6, 9]],
  zero: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  reflection: [[1, 0, 0], [0, 1, 0], [0, 0, -1]],
};

describe('svd3d', () => {
  for (const [name, m] of Object.entries(SAMPLES)) {
    it(`reconstructs A = U*Sigma*V^T (${name})`, () => {
      const { U, Sigma, V } = svd3d(m);
      const recon = matmul3(matmul3(U.values, Sigma.values), V.transpose().values);
      expectMatrixClose(recon, m);
    });

    it(`has orthogonal U, V and a proper-rotation U (${name})`, () => {
      const { U, V } = svd3d(m);
      expect(U.isOrthogonal()).toBe(true);
      expect(V.isOrthogonal()).toBe(true);
      expect(det3(U.values)).toBeGreaterThan(0);
    });
  }

  it('orders singular values descending and non-negative', () => {
    const { Sigma } = svd3d(SAMPLES.general);
    const s = [Sigma.values[0][0], Sigma.values[1][1], Sigma.values[2][2]];
    expect(s[0]).toBeGreaterThanOrEqual(s[1]);
    expect(s[1]).toBeGreaterThanOrEqual(s[2]);
    expect(s[2]).toBeGreaterThanOrEqual(0);
  });

  it('matches singular values of a diagonal matrix', () => {
    expect(new Matrix3x3(SAMPLES.diagonal).singularValues()).toEqual([3, 2, 1]);
  });
});

describe('luDecompose3', () => {
  it('reconstructs A = L*U with unit-lower L and upper U', () => {
    const { L, U } = luDecompose3(SAMPLES.general)!;
    expectMatrixClose(matmul3(L.values, U.values), SAMPLES.general);
    expect(L.values[0][1]).toBe(0);
    expect(L.values[0][2]).toBe(0);
    expect(L.values[1][2]).toBe(0);
    expect(L.values[0][0]).toBe(1);
    expect(U.values[1][0]).toBe(0);
    expect(U.values[2][0]).toBe(0);
    expect(U.values[2][1]).toBe(0);
  });

  it('returns null on a zero leading pivot', () => {
    expect(luDecompose3([[0, 1, 0], [1, 0, 0], [0, 0, 1]])).toBeNull();
  });
});

describe('qrDecompose3', () => {
  for (const name of ['general', 'symmetric', 'rank2', 'rank1', 'zero']) {
    it(`reconstructs A = Q*R with orthogonal Q and upper R (${name})`, () => {
      const m = SAMPLES[name];
      const { Q, R } = qrDecompose3(m);
      expectMatrixClose(matmul3(Q.values, R.values), m);
      expect(Q.isOrthogonal()).toBe(true);
      expect(Math.abs(R.values[1][0])).toBeLessThan(1e-12);
      expect(Math.abs(R.values[2][0])).toBeLessThan(1e-12);
      expect(Math.abs(R.values[2][1])).toBeLessThan(1e-12);
    });
  }
});

describe('eigenDecompose3', () => {
  it('reconstructs A = P*D*Pinv for a symmetric matrix', () => {
    const { P, D, Pinv } = eigenDecompose3(SAMPLES.symmetric)!;
    expectMatrixClose(matmul3(matmul3(P.values, D.values), Pinv.values), SAMPLES.symmetric);
  });

  it('handles a diagonal matrix with distinct eigenvalues', () => {
    const { P, D, Pinv } = eigenDecompose3(SAMPLES.diagonal)!;
    expectMatrixClose(matmul3(matmul3(P.values, D.values), Pinv.values), SAMPLES.diagonal);
  });

  it('handles a repeated eigenvalue with a full eigenspace', () => {
    const m: Matrix3x3Values = [[2, 0, 0], [0, 2, 0], [0, 0, 5]];
    const { P, D, Pinv } = eigenDecompose3(m)!;
    expectMatrixClose(matmul3(matmul3(P.values, D.values), Pinv.values), m);
  });

  it('returns null for complex eigenvalues (rotation about z)', () => {
    expect(eigenDecompose3(SAMPLES.rotation)).toBeNull();
  });

  it('returns null for a defective matrix (shear)', () => {
    expect(eigenDecompose3([[1, 1, 0], [0, 1, 0], [0, 0, 1]])).toBeNull();
  });
});

describe('stops', () => {
  const ends = (stops: Matrix3x3Values[] | null, a: Matrix3x3Values) => {
    expect(stops).not.toBeNull();
    expectMatrixClose(stops![0], I);
    expectMatrixClose(stops![stops!.length - 1], a);
  };

  it('svd stops run identity -> A', () => ends(svdStops3d(SAMPLES.general), SAMPLES.general));
  it('eigen stops run identity -> A', () => ends(eigenStops3d(SAMPLES.symmetric), SAMPLES.symmetric));
  it('lu stops run identity -> A', () => {
    const stops = luStops3d(SAMPLES.general)!;
    ends(stops, SAMPLES.general);
    expect(stops).toHaveLength(5);
  });
  it('qr stops run identity -> A', () => {
    const stops = qrStops3d(SAMPLES.general);
    ends(stops, SAMPLES.general);
    expect(stops).toHaveLength(5);
  });
});

describe('sequences', () => {
  it('builds every kind and step counts match the labels', () => {
    expect(buildDecompositionSequence3d('svd', SAMPLES.general)!.steps).toHaveLength(3);
    expect(buildDecompositionSequence3d('eigen', SAMPLES.symmetric)!.steps).toHaveLength(3);
    expect(buildDecompositionSequence3d('lu', SAMPLES.general)!.steps).toHaveLength(4);
    expect(buildDecompositionSequence3d('qr', SAMPLES.general)!.steps).toHaveLength(4);
  });

  it('returns null when eigen/LU do not apply', () => {
    expect(buildDecompositionSequence3d('eigen', SAMPLES.rotation)).toBeNull();
    expect(buildDecompositionSequence3d('lu', [[0, 1, 0], [1, 0, 0], [0, 0, 1]])).toBeNull();
  });
});
