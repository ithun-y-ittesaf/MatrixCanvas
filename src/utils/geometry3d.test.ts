import { describe, it, expect } from 'vitest';
import {
  shapeTopology,
  shapeMeshVertices,
  signedMeshVolume,
  transformedShapeVolume,
  unitSphereVertices,
  SPHERE_RINGS,
  SPHERE_SEGMENTS,
} from './geometry3d';
import { cubePresetVertices, pyramidPresetVertices } from '../store/appStore';
import { Matrix3x3 } from '../math/Matrix3x3';

describe('geometry3d', () => {
  it('cube of half-width 1 has volume 8 (outward winding => positive)', () => {
    const v = signedMeshVolume(cubePresetVertices(1), shapeTopology('cube').triangles);
    expect(v).toBeCloseTo(8, 9);
  });

  it('cube volume is independent of where it sits', () => {
    const moved = cubePresetVertices(0.5).map(([x, y, z]): [number, number, number] => [x + 3, y - 2, z + 1]);
    expect(signedMeshVolume(moved, shapeTopology('cube').triangles)).toBeCloseTo(1, 9);
  });

  it('pyramid preset has volume (1/3) * base 4 * height 2', () => {
    const v = signedMeshVolume(pyramidPresetVertices(), shapeTopology('pyramid').triangles);
    expect(v).toBeCloseTo(8 / 3, 9);
  });

  it('a linear map scales volume by |det|', () => {
    const m = new Matrix3x3([[2, 0, 0], [0, 3, 0], [1, 0, 1]]);
    const moved = cubePresetVertices(0.5).map((p) => m.multiply(p));
    expect(transformedShapeVolume('cube', moved)).toBeCloseTo(Math.abs(m.determinant()), 9);
  });

  it('a reflection is inside-out (negative signed) but reports positive volume', () => {
    const m = new Matrix3x3([[1, 0, 0], [0, 1, 0], [0, 0, -1]]);
    const moved = cubePresetVertices(0.5).map((p) => m.multiply(p));
    expect(signedMeshVolume(moved, shapeTopology('cube').triangles)).toBeCloseTo(-1, 9);
    expect(transformedShapeVolume('cube', moved)).toBeCloseTo(1, 9);
  });

  it('sphere tessellation has the expected size and points on the unit sphere', () => {
    const pts = unitSphereVertices();
    expect(pts).toHaveLength((SPHERE_RINGS + 1) * SPHERE_SEGMENTS);
    for (const [x, y, z] of pts) expect(Math.hypot(x, y, z)).toBeCloseTo(1, 9);
  });

  it('sphere mesh volume approaches 4/3 pi r^3 and is outward wound', () => {
    const pts = shapeMeshVertices('sphere', [[0, 0, 0]], 1);
    const v = signedMeshVolume(pts, shapeTopology('sphere').triangles);
    expect(v).toBeGreaterThan(0);
    expect(Math.abs(v - (4 / 3) * Math.PI) / ((4 / 3) * Math.PI)).toBeLessThan(0.03);
  });

  it('sphere mesh honours center and radius', () => {
    const pts = shapeMeshVertices('sphere', [[1, 2, 3]], 2);
    const [x, y, z] = pts[0];
    expect(Math.hypot(x - 1, y - 2, z - 3)).toBeCloseTo(2, 9);
  });

  it('all topology indices are in range', () => {
    for (const [type, count] of [
      ['cube', 8],
      ['pyramid', 5],
      ['sphere', (SPHERE_RINGS + 1) * SPHERE_SEGMENTS],
    ] as const) {
      const t = shapeTopology(type);
      expect(Math.max(...t.triangles)).toBeLessThan(count);
      expect(Math.max(...t.edges)).toBeLessThan(count);
    }
  });
});
