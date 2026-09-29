// Pure geometry for the 3D canvas's shapes: triangle/edge index lists per shape
// type, a unit-sphere tessellation, and volume. Kept free of three.js so it can
// be unit-tested in the default node environment.

import type { ShapeType3d } from '../store/appStore';

export type P3 = [number, number, number];

export interface ShapeTopology {
  // Triangle index triples, wound counter-clockwise seen from outside.
  triangles: number[];
  // Edge index pairs for the wireframe.
  edges: number[];
}

// cube: 8 corners indexed x + 2y + 4z (bit order), two triangles per face.
const CUBE: ShapeTopology = {
  triangles: [
    1, 3, 7, 1, 7, 5, // +x
    0, 4, 6, 0, 6, 2, // -x
    2, 6, 7, 2, 7, 3, // +y
    0, 1, 5, 0, 5, 4, // -y
    4, 5, 7, 4, 7, 6, // +z
    0, 2, 3, 0, 3, 1, // -z
  ],
  edges: [
    0, 1, 0, 2, 0, 4, 1, 3, 1, 5, 2, 3,
    2, 6, 3, 7, 4, 5, 4, 6, 5, 7, 6, 7,
  ],
};

// pyramid: 4 base corners (counter-clockwise seen from +z) then the apex.
const PYRAMID: ShapeTopology = {
  triangles: [
    0, 2, 1, 0, 3, 2, // base (faces -z)
    0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4, // sides
  ],
  edges: [0, 1, 1, 2, 2, 3, 3, 0, 0, 4, 1, 4, 2, 4, 3, 4],
};

export const SPHERE_RINGS = 16;
export const SPHERE_SEGMENTS = 32;

// UV sphere: ring i (0..RINGS) runs pole to pole; vertex = i * SEGMENTS + j.
// Poles are duplicated per segment, which leaves harmless zero-area triangles.
export function unitSphereVertices(): P3[] {
  const out: P3[] = [];
  for (let i = 0; i <= SPHERE_RINGS; i++) {
    const theta = (i / SPHERE_RINGS) * Math.PI;
    for (let j = 0; j < SPHERE_SEGMENTS; j++) {
      const phi = (j / SPHERE_SEGMENTS) * Math.PI * 2;
      out.push([
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta),
      ]);
    }
  }
  return out;
}

function sphereTopology(): ShapeTopology {
  const triangles: number[] = [];
  const edges: number[] = [];
  const S = SPHERE_SEGMENTS;
  for (let i = 0; i < SPHERE_RINGS; i++) {
    for (let j = 0; j < S; j++) {
      const a = i * S + j;
      const b = i * S + ((j + 1) % S);
      const c = (i + 1) * S + j;
      const d = (i + 1) * S + ((j + 1) % S);
      triangles.push(a, c, b, b, c, d);
    }
  }
  // Wireframe: every other latitude ring, every fourth meridian.
  for (let i = 2; i < SPHERE_RINGS; i += 2) {
    for (let j = 0; j < S; j++) edges.push(i * S + j, i * S + ((j + 1) % S));
  }
  for (let j = 0; j < S; j += 4) {
    for (let i = 0; i < SPHERE_RINGS; i++) edges.push(i * S + j, (i + 1) * S + j);
  }
  return { triangles, edges };
}

const SPHERE = sphereTopology();

export function shapeTopology(type: ShapeType3d): ShapeTopology {
  switch (type) {
    case 'cube': return CUBE;
    case 'pyramid': return PYRAMID;
    case 'sphere': return SPHERE;
  }
}

// World-space vertices of a shape's surface mesh in ORIGINAL (untransformed)
// space: the stored corners for cube/pyramid, or the tessellated sphere.
export function shapeMeshVertices(
  type: ShapeType3d,
  vertices: P3[],
  radius = 1,
): P3[] {
  if (type !== 'sphere') return vertices;
  const [cx, cy, cz] = vertices[0] ?? [0, 0, 0];
  return unitSphereVertices().map(
    ([x, y, z]): P3 => [cx + x * radius, cy + y * radius, cz + z * radius],
  );
}

// Signed volume of a closed, outward-wound triangle mesh (divergence theorem).
// Negative when a reflection has turned the mesh inside-out.
export function signedMeshVolume(points: P3[], triangles: number[]): number {
  let sum = 0;
  for (let t = 0; t < triangles.length; t += 3) {
    const a = points[triangles[t]];
    const b = points[triangles[t + 1]];
    const c = points[triangles[t + 2]];
    sum +=
      a[0] * (b[1] * c[2] - b[2] * c[1]) -
      a[1] * (b[0] * c[2] - b[2] * c[0]) +
      a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  return sum / 6;
}

// Volume of a shape after its vertices have been mapped through a linear
// transform (`transformed` are the already-transformed mesh vertices).
export function transformedShapeVolume(type: ShapeType3d, transformed: P3[]): number {
  return Math.abs(signedMeshVolume(transformed, shapeTopology(type).triangles));
}
