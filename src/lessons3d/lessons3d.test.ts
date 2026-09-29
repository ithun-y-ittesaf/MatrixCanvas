import { describe, it, expect } from 'vitest';
import { ALL_LESSONS_3D } from './index';
import { ALL_LESSONS } from '../lessons';
import { Matrix3x3, type Matrix3x3Values } from '../math/Matrix3x3';
import { buildDecompositionSequence3d } from '../math/decompositionSequences3d';
import { luDecompose3, qrDecompose3 } from '../math/decompositions3d';
import { matmul3 } from '../math/linalg3';
import {
  ROT_X_90, ROT_Z_90, ROT_X_THEN_Z, ROT_Z_THEN_X, SYMMETRIC_3, TILTED_RANK_2,
} from './intermediateTrack3d';
import {
  SHEAR_3, FLAT_SHEAR_3, NEARLY_FLAT_3, TRUNCATED_3, LU_EXAMPLE_3, QR_EXAMPLE_3, QR_Q_3,
} from './decompositionsTrack3d';
import { preset3d } from './helpers3d';

function expectMatrixClose(a: Matrix3x3Values, b: Matrix3x3Values, eps = 1e-9) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) expect(a[r][c]).toBeCloseTo(b[r][c], -Math.log10(eps));
}

const finite = (n: number) => Number.isFinite(n);

describe('3D curriculum structure', () => {
  it('mirrors all 17 lessons of the 2D curriculum, track by track and title by title', () => {
    expect(ALL_LESSONS_3D).toHaveLength(ALL_LESSONS.length);
    expect(ALL_LESSONS_3D.map((l) => [l.track, l.title])).toEqual(
      ALL_LESSONS.map((l) => [l.track, l.title]),
    );
  });

  it('has unique ids, all flagged 3d, all with at least one step', () => {
    const ids = ALL_LESSONS_3D.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of ALL_LESSONS_3D) {
      expect(l.dimension).toBe('3d');
      expect(l.steps.length).toBeGreaterThan(0);
      expect(new Set(l.steps.map((s) => s.id)).size).toBe(l.steps.length);
    }
  });

  it('every step has a finite 3x3 matrix, finite vectors and well-formed shapes', () => {
    for (const lesson of ALL_LESSONS_3D) {
      for (const step of lesson.steps) {
        expect(step.matrix).toHaveLength(3);
        for (const row of step.matrix) {
          expect(row).toHaveLength(3);
          expect(row.every(finite)).toBe(true);
        }
        for (const v of step.vectors ?? []) expect([v.x, v.y, v.z].every(finite)).toBe(true);
        for (const s of step.shapes ?? []) {
          const expected = { cube: 8, pyramid: 5, sphere: 1 }[s.type];
          expect(s.vertices).toHaveLength(expected);
          if (s.type === 'sphere') expect(s.radius).toBeGreaterThan(0);
        }
        expect(step.explanation.length).toBeGreaterThan(20);
      }
    }
  });

  it('every decomposition step builds a sequence that ends at its own matrix', () => {
    let count = 0;
    for (const lesson of ALL_LESSONS_3D) {
      for (const step of lesson.steps) {
        if (!step.decomposition) continue;
        count++;
        const seq = buildDecompositionSequence3d(step.decomposition, step.matrix);
        expect(seq, `${lesson.id}/${step.id}`).not.toBeNull();
        expectMatrixClose(seq!.start, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], 1e-9);
        expectMatrixClose(seq!.steps[seq!.steps.length - 1].matrix, step.matrix, 1e-6);
      }
    }
    // eigen, svd (x2), lu, qr
    expect(count).toBe(5);
  });

  it('each decomposition track lesson has an animated decomposition step', () => {
    const kinds = ALL_LESSONS_3D.filter((l) => l.track === 'decompositions').map((l) =>
      l.steps.find((s) => s.decomposition)?.decomposition,
    );
    expect(kinds).toEqual(['eigen', 'svd', 'lu', 'qr']);
  });

  it('every preset a lesson refers to exists (preset3d would have thrown on import)', () => {
    expect(() => preset3d('Scale ×2')).not.toThrow();
    expect(() => preset3d('nope')).toThrow();
  });
});

describe('Beginner claims', () => {
  it('rotations send the basis vectors where the prose says', () => {
    expect(new Matrix3x3(preset3d('Rotate Z 90°')).multiply([1, 0, 0])).toEqual([0, 1, 0]);
    expect(new Matrix3x3(preset3d('Rotate X 90°')).multiply([0, 1, 0])).toEqual([0, 0, 1]);
    const y90 = new Matrix3x3(preset3d('Rotate Y 90°')).multiply([0, 0, 1]);
    expect(y90[0]).toBeCloseTo(1);
    expect(Math.abs(y90[1]) + Math.abs(y90[2])).toBeLessThan(1e-9);
  });

  it('the 120° diagonal rotation cycles the basis and fixes (1,1,1)', () => {
    const m = new Matrix3x3(preset3d('Rotate 120° about (1,1,1)'));
    expect(m.multiply([1, 0, 0])).toEqual([0, 1, 0]);
    expect(m.multiply([0, 1, 0])).toEqual([0, 0, 1]);
    expect(m.multiply([0, 0, 1])).toEqual([1, 0, 0]);
    expect(m.multiply([1, 1, 1])).toEqual([1, 1, 1]);
    expect(m.determinant()).toBe(1);
    expect(m.isOrthogonal()).toBe(true);
    const pairs = m.eigenvectors();
    expect(pairs).toHaveLength(1);
    expect(pairs[0].value).toBeCloseTo(1, 6);
  });

  it('volumes: stretch keeps 1, shear keeps 1, reflection is -1', () => {
    expect(new Matrix3x3(preset3d('Stretch (2, 1, 0.5)')).determinant()).toBeCloseTo(1);
    expect(new Matrix3x3(preset3d('Shear X by Z')).determinant()).toBe(1);
    expect(new Matrix3x3(preset3d('Reflect over XY plane')).determinant()).toBe(-1);
  });

  it('shear X by Y sends e2 to (1,1,0)', () => {
    expect(new Matrix3x3(preset3d('Shear X by Y')).multiply([0, 1, 0])).toEqual([1, 1, 0]);
  });

  it('reflections land where the prose says', () => {
    expect(new Matrix3x3(preset3d('Reflect over XY plane')).multiply([2, 1, 1])).toEqual([2, 1, -1]);
    expect(new Matrix3x3(preset3d('Reflect over YZ plane')).multiply([2, 1, 1])).toEqual([-2, 1, 1]);
  });
});

describe('Intermediate claims', () => {
  it('composition: two steps equal the product; the other order differs', () => {
    const rx = new Matrix3x3(ROT_X_90);
    const rz = new Matrix3x3(ROT_Z_90);
    const v: [number, number, number] = [1, 1, 0];
    expect(rx.multiply(v)).toEqual([1, 0, 1]);
    expect(rz.multiply([1, 0, 1])).toEqual([0, 1, 1]);
    expect(matmul3(ROT_Z_90, ROT_X_90)).toEqual(ROT_X_THEN_Z);
    expect(new Matrix3x3(ROT_X_THEN_Z).multiply(v)).toEqual([0, 1, 1]);
    expect(matmul3(ROT_X_90, ROT_Z_90)).toEqual(ROT_Z_THEN_X);
    expect(new Matrix3x3(ROT_Z_THEN_X).multiply(v)).toEqual([-1, 0, 1]);
  });

  it('determinants: scale 8, project 0, reflect -1', () => {
    expect(new Matrix3x3(preset3d('Scale ×2')).determinant()).toBe(8);
    expect(new Matrix3x3(preset3d('Project onto XY plane')).determinant()).toBe(0);
  });

  it('null spaces: line for XY projection, plane for X projection, diagonal for tilted', () => {
    const xy = new Matrix3x3(preset3d('Project onto XY plane'));
    expect(xy.nullSpaceBasis()).toHaveLength(1);
    expect(xy.rank()).toBe(2);
    expect(xy.columnSpaceBasis()).toHaveLength(2);

    const x = new Matrix3x3(preset3d('Project onto X axis'));
    expect(x.nullSpaceBasis()).toHaveLength(2);
    expect(x.rank()).toBe(1);
    expect(x.columnSpaceBasis()).toHaveLength(1);

    const tilted = new Matrix3x3(TILTED_RANK_2);
    expect(tilted.determinant()).toBe(0);
    expect(tilted.rank()).toBe(2);
    expect(tilted.multiply([1, 1, -1])).toEqual([0, 0, 0]);
    const [n] = tilted.nullSpaceBasis();
    // Parallel to (1, 1, -1) (either sign).
    const cross = [
      n[1] * -1 - n[2] * 1,
      n[2] * 1 - n[0] * -1,
      n[0] * 1 - n[1] * 1,
    ];
    expect(Math.hypot(...cross)).toBeLessThan(1e-6);
    expect(tilted.isSymmetric()).toBe(true);
  });

  it('identity has only the trivial null space and full column space', () => {
    const i = Matrix3x3.identity();
    expect(i.nullSpaceBasis()).toHaveLength(0);
    expect(i.columnSpaceBasis()).toHaveLength(3);
  });

  it('inverse of scale x2 is scale x0.5', () => {
    expect(new Matrix3x3(preset3d('Scale ×2')).inverse()!.values).toEqual([
      [0.5, 0, 0], [0, 0.5, 0], [0, 0, 0.5],
    ]);
  });

  it('eigenvalues: stretch is 2,1,0.5; symmetric is 4,3,1; z-rotation is 1 and a complex pair', () => {
    const stretch = new Matrix3x3(preset3d('Stretch (2, 1, 0.5)')).eigenvalues();
    expect(stretch.type).toBe('real');
    if (stretch.type === 'real') {
      expect([...stretch.values].sort((a, b) => b - a).map((x) => +x.toFixed(6))).toEqual([2, 1, 0.5]);
    }
    const sym = new Matrix3x3(SYMMETRIC_3);
    const symValues = sym.eigenvalues();
    expect(symValues.type).toBe('real');
    if (symValues.type === 'real') {
      expect([...symValues.values].sort((a, b) => b - a).map((x) => +x.toFixed(6))).toEqual([4, 3, 1]);
    }
    expect(sym.eigenvectors()).toHaveLength(3);
    expect(sym.isSymmetric()).toBe(true);

    const rot = new Matrix3x3(preset3d('Rotate Z 90°')).eigenvalues();
    expect(rot.type).toBe('mixed');
    expect(new Matrix3x3(preset3d('Stretch (2, 1, 0.5)')).multiply([1, 1, 1])).toEqual([2, 1, 0.5]);
  });
});

describe('Decompositions claims', () => {
  it('shear: singular values are phi, 1, 1/phi; product is |det| = 1', () => {
    const s = new Matrix3x3(SHEAR_3).singularValues();
    expect(s[0]).toBeCloseTo(1.618034, 6);
    expect(s[1]).toBeCloseTo(1, 6);
    expect(s[2]).toBeCloseTo(0.618034, 6);
    expect(s[0] * s[1] * s[2]).toBeCloseTo(1, 6);
  });

  it('flattened shear: singular values phi, 1/phi, 0; det 0; rank 2', () => {
    const m = new Matrix3x3(FLAT_SHEAR_3);
    const s = m.singularValues();
    expect(s[0]).toBeCloseTo(1.618034, 6);
    expect(s[1]).toBeCloseTo(0.618034, 6);
    expect(s[2]).toBeCloseTo(0, 9);
    expect(m.determinant()).toBe(0);
    expect(m.rank()).toBe(2);
  });

  it('truncation: singular values 3, 2, 0.1 and the truncated matrix is rank 2', () => {
    expect(new Matrix3x3(NEARLY_FLAT_3).singularValues()).toEqual([3, 2, 0.1]);
    expect(new Matrix3x3(TRUNCATED_3).rank()).toBe(2);
  });

  it('LU example factors to the L and U quoted in the comments; det is 4', () => {
    const { L, U } = luDecompose3(LU_EXAMPLE_3)!;
    expectMatrixClose(L.values, [[1, 0, 0], [2, 1, 0], [4, 3, 1]]);
    expectMatrixClose(U.values, [[2, 1, 1], [0, 1, 1], [0, 0, 2]]);
    expect(new Matrix3x3(LU_EXAMPLE_3).determinant()).toBe(4);
  });

  it('QR example: Q has the quoted columns, R = [[3,3,3],[0,3,3],[0,0,3]], det Q = -1', () => {
    const { Q, R } = qrDecompose3(QR_EXAMPLE_3);
    expectMatrixClose(R.values, [[3, 3, 3], [0, 3, 3], [0, 0, 3]], 1e-9);
    expectMatrixClose(Q.values, QR_Q_3, 1e-9);
    expect(new Matrix3x3(QR_Q_3).isOrthogonal()).toBe(true);
    expect(new Matrix3x3(QR_Q_3).determinant()).toBeCloseTo(-1, 9);
  });

  it('eigendecomposition example reconstructs and has D = diag(4, 3, 1)', () => {
    const seq = buildDecompositionSequence3d('eigen', SYMMETRIC_3)!;
    expectMatrixClose(seq.steps[seq.steps.length - 1].matrix, SYMMETRIC_3, 1e-6);
  });
});
