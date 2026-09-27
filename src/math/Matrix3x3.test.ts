import { describe, it, expect } from 'vitest';
import { Matrix3x3 } from './Matrix3x3';

function expectClose(a: number, b: number, eps = 1e-9) {
  expect(Math.abs(a - b)).toBeLessThan(eps);
}

function sortedReal(values: [number, number, number]): number[] {
  return [...values].sort((a, b) => a - b);
}

describe('Matrix3x3', () => {
  it('multiply applies the matrix to a vector', () => {
    const m = new Matrix3x3([[2, 0, 0], [0, 3, 0], [0, 0, 4]]);
    expect(m.multiply([1, 1, 1])).toEqual([2, 3, 4]);
  });

  it('determinant and trace match the diagonal case', () => {
    const m = new Matrix3x3([[1, 0, 0], [0, 2, 0], [0, 0, 3]]);
    expect(m.determinant()).toBe(6);
    expect(m.trace()).toBe(6);
  });

  it('inverse recovers the identity when multiplied by the original', () => {
    const m = new Matrix3x3([[2, 1, 0], [0, 1, 3], [1, 0, 1]]);
    const inv = m.inverse()!;
    const product = new Matrix3x3([
      [
        m.values[0][0] * inv.values[0][0] + m.values[0][1] * inv.values[1][0] + m.values[0][2] * inv.values[2][0],
        m.values[0][0] * inv.values[0][1] + m.values[0][1] * inv.values[1][1] + m.values[0][2] * inv.values[2][1],
        m.values[0][0] * inv.values[0][2] + m.values[0][1] * inv.values[1][2] + m.values[0][2] * inv.values[2][2],
      ],
      [
        m.values[1][0] * inv.values[0][0] + m.values[1][1] * inv.values[1][0] + m.values[1][2] * inv.values[2][0],
        m.values[1][0] * inv.values[0][1] + m.values[1][1] * inv.values[1][1] + m.values[1][2] * inv.values[2][1],
        m.values[1][0] * inv.values[0][2] + m.values[1][1] * inv.values[1][2] + m.values[1][2] * inv.values[2][2],
      ],
      [
        m.values[2][0] * inv.values[0][0] + m.values[2][1] * inv.values[1][0] + m.values[2][2] * inv.values[2][0],
        m.values[2][0] * inv.values[0][1] + m.values[2][1] * inv.values[1][1] + m.values[2][2] * inv.values[2][1],
        m.values[2][0] * inv.values[0][2] + m.values[2][1] * inv.values[1][2] + m.values[2][2] * inv.values[2][2],
      ],
    ]);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expectClose(product.values[r][c], r === c ? 1 : 0, 1e-6);
      }
    }
  });

  it('inverse returns null for a singular matrix', () => {
    const m = new Matrix3x3([[1, 2, 3], [2, 4, 6], [1, 1, 1]]);
    expect(m.inverse()).toBeNull();
  });

  it('eigenvalues of the identity are all 1', () => {
    const result = Matrix3x3.identity().eigenvalues();
    expect(result.type).toBe('real');
    if (result.type === 'real') {
      expectClose(result.values[0], 1, 1e-6);
      expectClose(result.values[1], 1, 1e-6);
      expectClose(result.values[2], 1, 1e-6);
    }
  });

  it('eigenvalues of a diagonal matrix are its diagonal entries', () => {
    const m = new Matrix3x3([[1, 0, 0], [0, 2, 0], [0, 0, 3]]);
    const result = m.eigenvalues();
    expect(result.type).toBe('real');
    if (result.type === 'real') {
      const [a, b, c] = sortedReal(result.values);
      expectClose(a, 1, 1e-6);
      expectClose(b, 2, 1e-6);
      expectClose(c, 3, 1e-6);
    }
  });

  it('eigenvalues of a z-axis rotation are 1 and cos(theta) +/- i sin(theta)', () => {
    const theta = Math.PI / 3;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const m = new Matrix3x3([
      [cos, -sin, 0],
      [sin, cos, 0],
      [0, 0, 1],
    ]);
    const result = m.eigenvalues();
    expect(result.type).toBe('mixed');
    if (result.type === 'mixed') {
      const [real, c1, c2] = result.values;
      expectClose(real, 1, 1e-6);
      expectClose(c1.re, cos, 1e-6);
      expectClose(Math.abs(c1.im), sin, 1e-6);
      expectClose(c2.re, cos, 1e-6);
      expectClose(c2.im, -c1.im, 1e-6);
    }
  });
});
