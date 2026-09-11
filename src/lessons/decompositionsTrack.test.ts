import { describe, it, expect } from 'vitest';
import { Matrix2x2 } from '../math/Matrix2x2';
import { svd, luDecompose, qrDecompose, eigenDecompose } from '../math/decompositions';
import { DECOMPOSITIONS_TRACK } from './decompositionsTrack';

// Pins down the specific numeric claims decompositionsTrack.ts's lesson prose
// makes about its example matrices (eigenvalues 4/2, singular values phi/1-
// over-phi, LU's integer L/U, QR's 3-4-5-triangle Q/R) — so a future edit to
// either the lesson text or the example matrices that breaks one of those
// claims fails a test instead of silently going stale in front of a learner.
const TOL = 1e-6;

function close(a: number, b: number, tol = TOL) {
  expect(Math.abs(a - b)).toBeLessThan(tol);
}

describe('decompositionsTrack example matrices', () => {
  it('Eigendecomposition: [[3,1],[1,3]] has eigenvalues 4 and 2, eigenvectors along (1,1)/(1,-1)', () => {
    const m = new Matrix2x2([[3, 1], [1, 3]]);
    const spectrum = m.eigenvalues();
    expect(spectrum.type).toBe('real');
    if (spectrum.type === 'real') {
      close(spectrum.values[0], 4);
      close(spectrum.values[1], 2);
    }

    const result = eigenDecompose(m);
    expect(result).not.toBeNull();
    const { P } = result!;
    // Each eigenvector column is parallel to (1,1) or (1,-1): equal or
    // opposite components, whichever eigenvalue it belongs to.
    close(Math.abs(P.a), Math.abs(P.c));
    close(Math.abs(P.b), Math.abs(P.d));
  });

  it('SVD: the Horizontal Shear preset has singular values phi and 1/phi', () => {
    const phi = (1 + Math.sqrt(5)) / 2;
    const { Sigma } = svd([[1, 1], [0, 1]]);
    close(Sigma.a, phi);
    close(Sigma.d, 1 / phi);
    close(Sigma.a * Sigma.d, 1); // matches |det| = 1
  });

  it('LU: [[2,1],[4,3]] factors into integer L=[[1,0],[2,1]] and U=[[2,1],[0,1]]', () => {
    const result = luDecompose([[2, 1], [4, 3]]);
    expect(result).not.toBeNull();
    const { L, U } = result!;
    expect(L.values).toEqual([[1, 0], [2, 1]]);
    expect(U.values).toEqual([[2, 1], [0, 1]]);
  });

  it('QR: [[3,1],[4,1]] gives Q from the 3-4-5 triangle and R=[[5,1.4],[0,0.2]]', () => {
    const { Q, R } = qrDecompose([[3, 1], [4, 1]]);
    close(Q.a, 0.6);
    close(Q.c, 0.8);
    close(Q.b, 0.8);
    close(Q.d, -0.6);
    close(R.a, 5);
    close(R.b, 1.4);
    close(R.d, 0.2);
  });

  it('QR wrap-up: the loaded Q matrix [[0.6,0.8],[0.8,-0.6]] is itself orthogonal', () => {
    const q = new Matrix2x2([[0.6, 0.8], [0.8, -0.6]]);
    expect(q.isOrthogonal()).toBe(true);
  });
});

describe('DECOMPOSITIONS_TRACK structure', () => {
  it('has exactly the four lessons, one per decomposition, each with a decomposition-flagged step', () => {
    expect(DECOMPOSITIONS_TRACK).toHaveLength(4);
    const kinds = DECOMPOSITIONS_TRACK.map(
      (lesson) => lesson.steps.find((s) => s.decomposition)?.decomposition,
    );
    expect(kinds).toEqual(['eigen', 'svd', 'lu', 'qr']);
    for (const lesson of DECOMPOSITIONS_TRACK) {
      expect(lesson.track).toBe('decompositions');
    }
  });
});
