import { describe, it, expect } from 'vitest';
import type { Matrix2x2Values } from './Matrix2x2';
import {
  svdSequence,
  eigenSequence,
  luSequence,
  qrSequence,
  buildDecompositionSequence,
  type DecompositionSequence,
} from './decompositionSequences';

const IDENTITY: Matrix2x2Values = [[1, 0], [0, 1]];
const ROTATION: Matrix2x2Values = [[Math.cos(0.6), -Math.sin(0.6)], [Math.sin(0.6), Math.cos(0.6)]];
const SHEAR: Matrix2x2Values = [[1, 1.5], [0, 1]];
const SYMMETRIC: Matrix2x2Values = [[2, 1], [1, 3]];
const ZERO_PIVOT: Matrix2x2Values = [[0, 1], [1, 0]];

function expectWellFormed(seq: DecompositionSequence, expectedStepCount: number) {
  expect(seq.title.length).toBeGreaterThan(0);
  expect(seq.steps).toHaveLength(expectedStepCount);
  for (const step of seq.steps) {
    expect(step.label.length).toBeGreaterThan(0);
  }
}

describe('svdSequence', () => {
  it('has a title, identity start, and 3 labeled steps ending at A', () => {
    const seq = svdSequence(SYMMETRIC);
    expect(seq.start).toEqual(IDENTITY);
    expectWellFormed(seq, 3);
    const last = seq.steps[seq.steps.length - 1].matrix;
    last.forEach((row, i) => row.forEach((v, j) => expect(Math.abs(v - SYMMETRIC[i][j])).toBeLessThan(1e-6)));
  });
});

describe('eigenSequence', () => {
  it('has a title, identity start, and 3 labeled steps for a diagonalisable matrix', () => {
    const seq = eigenSequence(SYMMETRIC);
    expect(seq).not.toBeNull();
    expect(seq!.start).toEqual(IDENTITY);
    expectWellFormed(seq!, 3);
  });

  it('returns null for a rotation (complex eigenvalues)', () => {
    expect(eigenSequence(ROTATION)).toBeNull();
  });

  it('returns null for a defective matrix (shear)', () => {
    expect(eigenSequence(SHEAR)).toBeNull();
  });
});

describe('luSequence', () => {
  it('has a title, identity start, and 2 labeled steps', () => {
    const seq = luSequence(SYMMETRIC);
    expect(seq).not.toBeNull();
    expect(seq!.start).toEqual(IDENTITY);
    expectWellFormed(seq!, 2);
  });

  it('returns null when the top-left pivot is zero', () => {
    expect(luSequence(ZERO_PIVOT)).toBeNull();
  });
});

describe('qrSequence', () => {
  it('has a title, identity start, and 3 labeled steps', () => {
    const seq = qrSequence(SYMMETRIC);
    expect(seq.start).toEqual(IDENTITY);
    expectWellFormed(seq, 3);
  });
});

describe('buildDecompositionSequence', () => {
  it('dispatches to the matching builder for each kind', () => {
    expect(buildDecompositionSequence('svd', SYMMETRIC)).toEqual(svdSequence(SYMMETRIC));
    expect(buildDecompositionSequence('eigen', SYMMETRIC)).toEqual(eigenSequence(SYMMETRIC));
    expect(buildDecompositionSequence('lu', SYMMETRIC)).toEqual(luSequence(SYMMETRIC));
    expect(buildDecompositionSequence('qr', SYMMETRIC)).toEqual(qrSequence(SYMMETRIC));
  });

  it('propagates null for a kind with no valid decomposition', () => {
    expect(buildDecompositionSequence('eigen', ROTATION)).toBeNull();
    expect(buildDecompositionSequence('lu', ZERO_PIVOT)).toBeNull();
  });
});
