import * as THREE from 'three';
import type { TransformableShape3d } from '../../store/appStore';
import type { Matrix3x3Values } from '../../math/Matrix3x3';
import {
  shapeTopology,
  shapeMeshVertices,
  transformedShapeVolume,
  type P3,
} from '../../utils/geometry3d';

// The scene objects for one 3D shape: a translucent transformed surface, its
// solid wireframe, and a faint dashed ghost of the original (untransformed)
// shape. The original vertices are kept as `base`; every frame's positions are
// `matrix * base`, never accumulated onto the previous frame.
export class ShapeView {
  readonly group = new THREE.Group();
  readonly mesh: THREE.Mesh;
  shape: TransformableShape3d;

  private topology;
  private base: P3[];
  private transformed: P3[];
  private positions: THREE.BufferAttribute;
  private meshGeometry = new THREE.BufferGeometry();
  private edgeGeometry = new THREE.BufferGeometry();
  private ghostGeometry = new THREE.BufferGeometry();
  private meshMaterial: THREE.MeshStandardMaterial;
  private edgeMaterial: THREE.LineBasicMaterial;
  private ghostMaterial: THREE.LineDashedMaterial;
  private ghost: THREE.LineSegments;

  constructor(shape: TransformableShape3d) {
    this.shape = shape;
    this.topology = shapeTopology(shape.type);
    this.base = shapeMeshVertices(shape.type, shape.vertices, shape.radius);
    this.transformed = this.base.map((p): P3 => [...p]);

    this.positions = new THREE.BufferAttribute(new Float32Array(this.base.length * 3), 3);
    this.meshGeometry.setAttribute('position', this.positions);
    this.meshGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(this.topology.triangles), 1));
    this.edgeGeometry.setAttribute('position', this.positions);
    this.edgeGeometry.setIndex(new THREE.BufferAttribute(new Uint16Array(this.topology.edges), 1));

    this.meshMaterial = new THREE.MeshStandardMaterial({
      color: shape.color,
      transparent: true,
      opacity: 0.32,
      flatShading: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.edgeMaterial = new THREE.LineBasicMaterial({ color: shape.color });
    this.ghostMaterial = new THREE.LineDashedMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      dashSize: 0.12,
      gapSize: 0.1,
    });

    this.mesh = new THREE.Mesh(this.meshGeometry, this.meshMaterial);
    this.mesh.userData.shapeId = shape.id;
    const edges = new THREE.LineSegments(this.edgeGeometry, this.edgeMaterial);
    this.ghost = new THREE.LineSegments(this.ghostGeometry, this.ghostMaterial);
    // Bounding spheres go stale every frame as positions change.
    this.mesh.frustumCulled = false;
    edges.frustumCulled = false;
    this.ghost.frustumCulled = false;
    this.group.add(this.mesh, edges, this.ghost);
    this.writeGhost();
  }

  // Same type and vertex count: the existing buffers can be reused.
  canReuseFor(shape: TransformableShape3d): boolean {
    return (
      shape.type === this.shape.type &&
      (shape.type === 'sphere' || shape.vertices.length === this.shape.vertices.length)
    );
  }

  setShape(shape: TransformableShape3d) {
    this.shape = shape;
    this.mesh.userData.shapeId = shape.id;
    this.base = shapeMeshVertices(shape.type, shape.vertices, shape.radius);
    this.meshMaterial.color.set(shape.color);
    this.edgeMaterial.color.set(shape.color);
    this.writeGhost();
  }

  // The ghost is a non-indexed segment list because
  // LineSegments.computeLineDistances (needed for dashes) ignores the index.
  private writeGhost() {
    const edges = this.topology.edges;
    const out = new Float32Array(edges.length * 3);
    for (let i = 0; i < edges.length; i++) {
      const p = this.base[edges[i]];
      out[i * 3] = p[0];
      out[i * 3 + 1] = p[1];
      out[i * 3 + 2] = p[2];
    }
    this.ghostGeometry.setAttribute('position', new THREE.BufferAttribute(out, 3));
    this.ghost.computeLineDistances();
  }

  apply(m: Matrix3x3Values) {
    for (let i = 0; i < this.base.length; i++) {
      const [x, y, z] = this.base[i];
      const tx = m[0][0] * x + m[0][1] * y + m[0][2] * z;
      const ty = m[1][0] * x + m[1][1] * y + m[1][2] * z;
      const tz = m[2][0] * x + m[2][1] * y + m[2][2] * z;
      this.transformed[i][0] = tx;
      this.transformed[i][1] = ty;
      this.transformed[i][2] = tz;
      this.positions.setXYZ(i, tx, ty, tz);
    }
    this.positions.needsUpdate = true;
    // Raycasting (drag / double-click) consults the geometry's bounding sphere.
    this.meshGeometry.computeBoundingSphere();
  }

  volume(): number {
    return transformedShapeVolume(this.shape.type, this.transformed);
  }

  // Centre of the transformed shape, for placing its label.
  centroid(): P3 {
    if (this.shape.type === 'sphere') return this.sphereCenter();
    let x = 0;
    let y = 0;
    let z = 0;
    for (const p of this.transformed) {
      x += p[0];
      y += p[1];
      z += p[2];
    }
    const n = this.transformed.length || 1;
    return [x / n, y / n, z / n];
  }

  // The tessellation's centre = mean of its poles (first and last ring).
  private sphereCenter(): P3 {
    const a = this.transformed[0];
    const b = this.transformed[this.transformed.length - 1];
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  }

  dispose() {
    this.meshGeometry.dispose();
    this.edgeGeometry.dispose();
    this.ghostGeometry.dispose();
    this.meshMaterial.dispose();
    this.edgeMaterial.dispose();
    this.ghostMaterial.dispose();
  }
}
