import * as THREE from 'three';

// A solid arrow (cylinder shaft + cone head) from the origin to a vector.
// WebGL lines are always 1px wide, so real geometry is what keeps vectors
// legible next to the wireframes; the geometries are shared and unit-sized,
// each arrow just scales/orients them.
const SHAFT_GEO = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).translate(0, 0.5, 0);
const HEAD_GEO = new THREE.ConeGeometry(1, 1, 16).translate(0, 0.5, 0);
const UP = new THREE.Vector3(0, 1, 0);
const tmpDir = new THREE.Vector3();

export class Arrow3D {
  readonly group = new THREE.Group();
  private shaft: THREE.Mesh;
  private head: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;

  constructor(color: string | number, private radius = 0.026) {
    this.material = new THREE.MeshBasicMaterial({ color });
    this.shaft = new THREE.Mesh(SHAFT_GEO, this.material);
    this.head = new THREE.Mesh(HEAD_GEO, this.material);
    this.group.add(this.shaft, this.head);
  }

  setColor(color: string | number) {
    this.material.color.set(color);
  }

  setVector(x: number, y: number, z: number) {
    const len = Math.hypot(x, y, z);
    if (len < 1e-6) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;
    tmpDir.set(x / len, y / len, z / len);
    this.group.quaternion.setFromUnitVectors(UP, tmpDir);

    const headLen = Math.min(0.26, len * 0.4);
    const headRadius = Math.min(this.radius * 3.2, len * 0.12);
    this.shaft.scale.set(this.radius, Math.max(len - headLen, 1e-4), this.radius);
    this.head.position.y = len - headLen;
    this.head.scale.set(headRadius, headLen, headRadius);
  }

  // Only the per-instance material is ours - the geometries are module-level
  // and shared by every arrow.
  dispose() {
    this.material.dispose();
  }
}
