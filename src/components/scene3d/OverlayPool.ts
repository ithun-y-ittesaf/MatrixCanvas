import * as THREE from 'three';
import { Matrix3x3, type Matrix3x3Values } from '../../math/Matrix3x3';
import { cross3, norm3, type Vec3, svd3 } from '../../math/linalg3';
import {
  COLOR_COLUMN_SPACE,
  COLOR_EIGEN,
  COLOR_NULL_SPACE,
  COLOR_SINGULAR,
} from '../../theme';
import type { Overlay3d } from '../../store/appStore';
import { Arrow3D } from './Arrow3D';

const EXTENT = 6; // half-length of overlay lines / half-size of overlay planes
const DOT_GEO = new THREE.SphereGeometry(0.09, 12, 8);
const PLANE_GEO = new THREE.PlaneGeometry(1, 1);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// Preallocated line / arrow / plane / dot objects that the geometric overlays
// (eigenvector lines, null space, column space, singular axes) draw into. The
// pool avoids creating and disposing scene objects every time the matrix
// changes: `rebuild` hides everything, then re-activates what the current
// matrix needs.
//
// Overlays are computed from the TARGET matrix (matrixValues3d), not the
// mid-tween display matrix: eigenlines and the null/column spaces are
// properties of the matrix itself, so they stay put while the space animates.
export class OverlayPool {
  readonly group = new THREE.Group();
  private lines: { line: THREE.Line; material: THREE.LineBasicMaterial }[] = [];
  private arrows: Arrow3D[] = [];
  private planes: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial }[] = [];
  private dots: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial }[] = [];
  private usedLines = 0;
  private usedArrows = 0;
  private usedPlanes = 0;
  private usedDots = 0;

  constructor() {
    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
      const material = new THREE.LineBasicMaterial({ color: 0xffffff });
      const line = new THREE.Line(geometry, material);
      line.frustumCulled = false;
      line.visible = false;
      this.lines.push({ line, material });
      this.group.add(line);
    }
    for (let i = 0; i < 6; i++) {
      const arrow = new Arrow3D(0xffffff, 0.02);
      arrow.group.visible = false;
      this.arrows.push(arrow);
      this.group.add(arrow.group);
    }
    for (let i = 0; i < 2; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(PLANE_GEO, material);
      mesh.visible = false;
      this.planes.push({ mesh, material });
      this.group.add(mesh);
    }
    for (let i = 0; i < 2; i++) {
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mesh = new THREE.Mesh(DOT_GEO, material);
      mesh.visible = false;
      this.dots.push({ mesh, material });
      this.group.add(mesh);
    }
  }

  private line(dir: Vec3, color: string, extent = EXTENT) {
    const slot = this.lines[this.usedLines++];
    if (!slot) return;
    const pos = slot.line.geometry.getAttribute('position') as THREE.BufferAttribute;
    pos.setXYZ(0, -dir[0] * extent, -dir[1] * extent, -dir[2] * extent);
    pos.setXYZ(1, dir[0] * extent, dir[1] * extent, dir[2] * extent);
    pos.needsUpdate = true;
    slot.material.color.set(color);
    slot.line.visible = true;
  }

  private arrow(v: Vec3, color: string) {
    const a = this.arrows[this.usedArrows++];
    if (!a) return;
    a.setColor(color);
    a.setVector(v[0], v[1], v[2]);
  }

  private plane(basisA: Vec3, basisB: Vec3, color: string) {
    const slot = this.planes[this.usedPlanes++];
    if (!slot) return;
    const n = cross3(basisA, basisB);
    const len = norm3(n);
    if (len < 1e-9) return;
    slot.mesh.quaternion.setFromUnitVectors(Z_AXIS, new THREE.Vector3(n[0] / len, n[1] / len, n[2] / len));
    slot.mesh.scale.set(EXTENT * 2, EXTENT * 2, 1);
    slot.material.color.set(color);
    slot.mesh.visible = true;
  }

  private dot(color: string) {
    const slot = this.dots[this.usedDots++];
    if (!slot) return;
    slot.material.color.set(color);
    slot.mesh.visible = true;
  }

  private hideAll() {
    for (const { line } of this.lines) line.visible = false;
    for (const a of this.arrows) a.group.visible = false;
    for (const { mesh } of this.planes) mesh.visible = false;
    for (const { mesh } of this.dots) mesh.visible = false;
    this.usedLines = this.usedArrows = this.usedPlanes = this.usedDots = 0;
  }

  // Draws the requested overlays for `matrix`. The unit sphere overlay is not
  // handled here - it deforms every frame, so the canvas builds it as a shape.
  rebuild(matrix: Matrix3x3Values, overlays: Overlay3d[]) {
    this.hideAll();
    const m = new Matrix3x3(matrix);

    if (overlays.includes('eigenvectors')) {
      m.eigenvectors().forEach(({ value, vector }, i) => {
        const color = COLOR_EIGEN[i % COLOR_EIGEN.length];
        this.line(vector, color);
        // The image of the unit eigenvector: M v = lambda v, on the same line.
        this.arrow([vector[0] * value, vector[1] * value, vector[2] * value], color);
      });
    }

    if (overlays.includes('nullSpace')) {
      const basis = m.nullSpaceBasis();
      if (basis.length === 1) this.line(basis[0], COLOR_NULL_SPACE);
      else if (basis.length === 2) this.plane(basis[0], basis[1], COLOR_NULL_SPACE);
      else if (basis.length === 3) this.dot(COLOR_NULL_SPACE);
    }

    if (overlays.includes('columnSpace')) {
      const basis = m.columnSpaceBasis();
      if (basis.length === 1) this.line(basis[0], COLOR_COLUMN_SPACE);
      else if (basis.length === 2) this.plane(basis[0], basis[1], COLOR_COLUMN_SPACE);
      else if (basis.length === 0) this.dot(COLOR_COLUMN_SPACE);
    }

    if (overlays.includes('singularAxes')) {
      const { U, sigma } = svd3(matrix);
      for (let i = 0; i < 3; i++) {
        if (sigma[i] < 1e-9) continue;
        const u: Vec3 = [U[0][i], U[1][i], U[2][i]];
        const color = COLOR_SINGULAR[i];
        this.line(u, color, sigma[i]);
        this.arrow([u[0] * sigma[i], u[1] * sigma[i], u[2] * sigma[i]], color);
      }
    }
  }

  dispose() {
    for (const { line, material } of this.lines) {
      line.geometry.dispose();
      material.dispose();
    }
    for (const a of this.arrows) a.dispose();
    for (const { material } of this.planes) material.dispose();
    for (const { material } of this.dots) material.dispose();
  }
}
