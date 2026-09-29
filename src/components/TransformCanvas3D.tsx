import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { Matrix3x3, type Matrix3x3Values } from '../math/Matrix3x3';
import { useAppStore, type CustomVector3d } from '../store/appStore';
import { COLOR_BASIS_X, COLOR_BASIS_Y, COLOR_BASIS_Z } from '../theme';
import { fmt } from '../utils/format';
import { Arrow3D } from './scene3d/Arrow3D';
import { ShapeView } from './scene3d/ShapeView';
import { OverlayPool } from './scene3d/OverlayPool';

// The 3D counterpart of TransformCanvas: same store-driven model (a display
// matrix interpolated from animFrom3d -> matrixValues3d by animProgress, an
// on-demand redraw loop, GSAP tween on animTrigger), rendered with three.js.
//
// Axes: z is up, so the 2D plane is exactly this scene's xy-plane and any 2D
// intuition carries over. Deformation is always `display * original`, never
// accumulated onto the previous frame.

const GRID_RANGE = 10;
const HOME_POSITION = new THREE.Vector3(5.4, -7.2, 4.6);
const HOME_DISTANCE = HOME_POSITION.length();
// Pointer-to-tip distance (px) within which a vector's arrowhead counts as
// "grabbed" for dragging or double-click delete.
const HIT_RADIUS = 16;
const IDENTITY: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

function mul(m: Matrix3x3Values, x: number, y: number, z: number): [number, number, number] {
  return [
    m[0][0] * x + m[0][1] * y + m[0][2] * z,
    m[1][0] * x + m[1][1] * y + m[1][2] * z,
    m[2][0] * x + m[2][1] * y + m[2][2] * z,
  ];
}

function computeDisplay(from: Matrix3x3Values, to: Matrix3x3Values, t: number): Matrix3x3Values {
  return new Matrix3x3(from).interpolateDecomposed(new Matrix3x3(to), t).values;
}

// A set of line segments whose endpoints are deformed by the display matrix.
class DeformableLines {
  readonly object: THREE.LineSegments;
  private positions: THREE.BufferAttribute;
  private material: THREE.LineBasicMaterial;

  constructor(private base: number[], color: string | number, opacity: number) {
    const geometry = new THREE.BufferGeometry();
    this.positions = new THREE.BufferAttribute(new Float32Array(base.length), 3);
    geometry.setAttribute('position', this.positions);
    this.material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    this.object = new THREE.LineSegments(geometry, this.material);
    this.object.frustumCulled = false;
  }

  apply(m: Matrix3x3Values) {
    for (let i = 0; i < this.base.length; i += 3) {
      const [x, y, z] = mul(m, this.base[i], this.base[i + 1], this.base[i + 2]);
      this.positions.setXYZ(i / 3, x, y, z);
    }
    this.positions.needsUpdate = true;
  }

  dispose() {
    this.object.geometry.dispose();
    this.material.dispose();
  }
}

// Grid lines of the plane spanned by axes (a, b) at i = -range..range: a line
// varying `b` at each fixed a = i, and (optionally) the reverse.
function planeGrid(a: 0 | 1 | 2, b: 0 | 1 | 2, range: number, varyingAxis: 'a' | 'b'): number[] {
  const out: number[] = [];
  for (let i = -range; i <= range; i++) {
    if (i === 0) continue;
    const p0 = [0, 0, 0];
    const p1 = [0, 0, 0];
    if (varyingAxis === 'b') {
      p0[a] = i; p1[a] = i; p0[b] = -range; p1[b] = range;
    } else {
      p0[b] = i; p1[b] = i; p0[a] = -range; p1[a] = range;
    }
    out.push(...p0, ...p1);
  }
  return out;
}

interface Label {
  el: HTMLDivElement;
  world: THREE.Vector3;
}

interface TransformCanvas3DProps {
  onZoomChange?: (percent: number) => void;
}

type Drag =
  | { kind: 'vector'; id: string; inv: Matrix3x3Values | null; plane: THREE.Plane }
  | {
      kind: 'shape';
      id: string;
      inv: Matrix3x3Values | null;
      plane: THREE.Plane;
      startVertices: [number, number, number][];
      hit: THREE.Vector3;
    }
  | null;

export default function TransformCanvas3D({ onZoomChange }: TransformCanvas3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const onZoomRef = useRef(onZoomChange);
  onZoomRef.current = onZoomChange;

  const animTrigger = useAppStore((s) => s.animTrigger);
  const setAnimProgress = useAppStore((s) => s.setAnimProgress);
  const isScrubbing = useAppStore((s) => s.isScrubbing);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const labelHost = labelsRef.current;
    if (!container || !labelHost) return;

    // ---- renderer / camera / controls ------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b12);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.up.set(0, 0, 1);
    camera.position.copy(HOME_POSITION);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.minDistance = 1.5;
    controls.maxDistance = 45;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(4, -6, 8);
    scene.add(sun);

    let dirty = true;
    const markDirty = () => { dirty = true; };

    // ---- static reference grid (identity), xy-plane ----------------------
    const refGrid = new THREE.GridHelper(GRID_RANGE * 2, GRID_RANGE * 2, 0xffffff, 0xffffff);
    refGrid.rotation.x = Math.PI / 2;
    const refMaterial = refGrid.material as THREE.LineBasicMaterial;
    refMaterial.transparent = true;
    refMaterial.opacity = 0.06;
    scene.add(refGrid);

    // ---- deformed grids and axes -----------------------------------------
    const deformables: DeformableLines[] = [
      // xy-plane, colored like 2D's transformed grid (vertical blue, horizontal red)
      new DeformableLines(planeGrid(0, 1, GRID_RANGE, 'b'), COLOR_BASIS_Y, 0.35),
      new DeformableLines(planeGrid(0, 1, GRID_RANGE, 'a'), COLOR_BASIS_X, 0.3),
      // xz- and yz-planes, faint, so depth reads without clutter
      new DeformableLines(
        [...planeGrid(0, 2, 6, 'b'), ...planeGrid(0, 2, 6, 'a')], COLOR_BASIS_Z, 0.12),
      new DeformableLines(
        [...planeGrid(1, 2, 6, 'b'), ...planeGrid(1, 2, 6, 'a')], COLOR_BASIS_Z, 0.12),
      // axes
      new DeformableLines([-GRID_RANGE, 0, 0, GRID_RANGE, 0, 0], COLOR_BASIS_X, 0.8),
      new DeformableLines([0, -GRID_RANGE, 0, 0, GRID_RANGE, 0], COLOR_BASIS_Y, 0.8),
      new DeformableLines([0, 0, -GRID_RANGE, 0, 0, GRID_RANGE], COLOR_BASIS_Z, 0.8),
    ];
    for (const d of deformables) scene.add(d.object);

    // ---- basis vectors ---------------------------------------------------
    const basis = [
      new Arrow3D(COLOR_BASIS_X, 0.032),
      new Arrow3D(COLOR_BASIS_Y, 0.032),
      new Arrow3D(COLOR_BASIS_Z, 0.032),
    ];
    for (const b of basis) scene.add(b.group);

    const origin = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    scene.add(origin);

    const overlays = new OverlayPool();
    scene.add(overlays.group);

    // ---- dynamic content: custom vectors, shapes, unit-sphere overlay ----
    interface VectorView {
      vector: CustomVector3d;
      arrow: Arrow3D;
      ghost: THREE.Line;
      ghostGeometry: THREE.BufferGeometry;
    }
    const ghostMaterial = new THREE.LineDashedMaterial({
      color: 0xffffff, transparent: true, opacity: 0.3, dashSize: 0.1, gapSize: 0.08,
    });
    const vectorViews = new Map<string, VectorView>();
    const shapeViews = new Map<string, ShapeView>();
    let unitSphere: ShapeView | null = null;

    let lastVectors: CustomVector3d[] | null = null;
    let lastShapes: unknown = null;
    let lastMatrix: Matrix3x3Values | null = null;
    let lastOverlays: unknown = null;

    const syncVectors = (vectors: CustomVector3d[]) => {
      if (vectors === lastVectors) return;
      lastVectors = vectors;
      const live = new Set(vectors.map((v) => v.id));
      for (const [id, view] of vectorViews) {
        if (live.has(id)) continue;
        scene.remove(view.arrow.group, view.ghost);
        view.arrow.dispose();
        view.ghostGeometry.dispose();
        vectorViews.delete(id);
      }
      for (const v of vectors) {
        let view = vectorViews.get(v.id);
        if (!view) {
          const arrow = new Arrow3D(v.color, 0.026);
          const ghostGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(), new THREE.Vector3(v.x, v.y, v.z),
          ]);
          const ghost = new THREE.Line(ghostGeometry, ghostMaterial);
          ghost.computeLineDistances();
          ghost.frustumCulled = false;
          scene.add(arrow.group, ghost);
          view = { vector: v, arrow, ghost, ghostGeometry };
          vectorViews.set(v.id, view);
        } else {
          view.vector = v;
          view.arrow.setColor(v.color);
          const pos = view.ghostGeometry.getAttribute('position') as THREE.BufferAttribute;
          pos.setXYZ(1, v.x, v.y, v.z);
          pos.needsUpdate = true;
          view.ghost.computeLineDistances();
        }
      }
    };

    const syncShapes = (shapes: ReturnType<typeof useAppStore.getState>['shapes3d']) => {
      if (shapes === lastShapes) return;
      lastShapes = shapes;
      const live = new Set(shapes.map((s) => s.id));
      for (const [id, view] of shapeViews) {
        if (live.has(id)) continue;
        scene.remove(view.group);
        view.dispose();
        shapeViews.delete(id);
      }
      for (const shape of shapes) {
        const existing = shapeViews.get(shape.id);
        if (existing && existing.canReuseFor(shape)) {
          existing.setShape(shape);
        } else {
          if (existing) {
            scene.remove(existing.group);
            existing.dispose();
          }
          const view = new ShapeView(shape);
          scene.add(view.group);
          shapeViews.set(shape.id, view);
        }
      }
    };

    const syncOverlays = (matrix: Matrix3x3Values, list: ReturnType<typeof useAppStore.getState>['overlays3d']) => {
      if (matrix === lastMatrix && list === lastOverlays) return;
      const listChanged = list !== lastOverlays;
      lastMatrix = matrix;
      lastOverlays = list;
      overlays.rebuild(matrix, list);
      if (listChanged) {
        const wantSphere = list.includes('unitSphere');
        if (wantSphere && !unitSphere) {
          unitSphere = new ShapeView({
            id: '__unit-sphere', type: 'sphere', vertices: [[0, 0, 0]], radius: 1,
            color: '#22d3ee', seq: -1,
          });
          unitSphere.mesh.userData.shapeId = undefined; // not draggable / deletable
          scene.add(unitSphere.group);
        } else if (!wantSphere && unitSphere) {
          scene.remove(unitSphere.group);
          unitSphere.dispose();
          unitSphere = null;
        }
      }
    };

    // ---- labels (HTML, projected each frame) ------------------------------
    const labels = new Map<string, Label>();
    const seen = new Set<string>();
    const setLabel = (key: string, text: string, color: string, x: number, y: number, z: number) => {
      seen.add(key);
      let label = labels.get(key);
      if (!label) {
        const el = document.createElement('div');
        el.style.cssText =
          'position:absolute;left:0;top:0;white-space:nowrap;font:600 12px Inter,sans-serif;' +
          'text-shadow:0 0 4px #0a0b12,0 0 4px #0a0b12;will-change:transform;';
        el.style.color = color;
        labelHost.appendChild(el);
        label = { el, world: new THREE.Vector3() };
        labels.set(key, label);
      }
      if (label.el.textContent !== text) label.el.textContent = text;
      label.el.style.color = color;
      label.world.set(x, y, z);
    };
    const flushLabels = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const ndc = new THREE.Vector3();
      for (const [key, label] of labels) {
        if (!seen.has(key)) {
          label.el.remove();
          labels.delete(key);
          continue;
        }
        ndc.copy(label.world).project(camera);
        const visible = ndc.z < 1 && ndc.z > -1;
        label.el.style.display = visible ? 'block' : 'none';
        if (visible) {
          const px = (ndc.x * 0.5 + 0.5) * w + 8;
          const py = (-ndc.y * 0.5 + 0.5) * h - 16;
          label.el.style.transform = `translate(${px}px, ${py}px)`;
        }
      }
      seen.clear();
    };

    // ---- per-frame draw --------------------------------------------------
    let display: Matrix3x3Values = IDENTITY;
    const draw = () => {
      const st = useAppStore.getState();
      syncVectors(st.customVectors3d);
      syncShapes(st.shapes3d);
      syncOverlays(st.matrixValues3d, st.overlays3d);

      display = computeDisplay(st.animFrom3d, st.matrixValues3d, st.animProgress);
      for (const d of deformables) d.apply(display);

      const [ix, iy, iz] = mul(display, 1, 0, 0);
      const [jx, jy, jz] = mul(display, 0, 1, 0);
      const [kx, ky, kz] = mul(display, 0, 0, 1);
      basis[0].setVector(ix, iy, iz);
      basis[1].setVector(jx, jy, jz);
      basis[2].setVector(kx, ky, kz);
      setLabel('i', 'î', COLOR_BASIS_X, ix, iy, iz);
      setLabel('j', 'ĵ', COLOR_BASIS_Y, jx, jy, jz);
      setLabel('k', 'k̂', COLOR_BASIS_Z, kx, ky, kz);

      for (const [id, view] of vectorViews) {
        const v = view.vector;
        const [tx, ty, tz] = mul(display, v.x, v.y, v.z);
        view.arrow.setVector(tx, ty, tz);
        setLabel(`v:${id}`, `(${fmt(tx, 2)}, ${fmt(ty, 2)}, ${fmt(tz, 2)})`, v.color, tx, ty, tz);
      }

      for (const [id, view] of shapeViews) {
        view.apply(display);
        const [cx, cy, cz] = view.centroid();
        setLabel(`s:${id}`, `Vol: ${view.volume().toFixed(2)}`, view.shape.color, cx, cy, cz);
      }
      unitSphere?.apply(display);

      flushLabels();
      renderer.render(scene, camera);
    };

    // ---- size, loop ------------------------------------------------------
    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
      dirty = true;
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const unsubscribe = useAppStore.subscribe(markDirty);

    let lastZoom = -1;
    controls.addEventListener('change', () => {
      dirty = true;
      const pct = Math.round((HOME_DISTANCE / camera.position.distanceTo(controls.target)) * 100);
      if (pct !== lastZoom) {
        lastZoom = pct;
        onZoomRef.current?.(pct);
      }
    });

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update(); // fires 'change' (=> dirty) while damping settles
      if (!dirty) return;
      dirty = false;
      draw();
    };
    raf = requestAnimationFrame(loop);

    // ---- interaction -----------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const ndcOf = (e: PointerEvent | MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      return {
        px: e.clientX - rect.left,
        py: e.clientY - rect.top,
        ndc: new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -(((e.clientY - rect.top) / rect.height) * 2 - 1),
        ),
      };
    };
    const locked = () => useAppStore.getState().activeLesson !== null;

    // Screen-space distance from a display-space point to the pointer.
    const screenDist = (p: THREE.Vector3, px: number, py: number) => {
      const q = p.clone().project(camera);
      if (q.z > 1) return Infinity;
      const w = container.clientWidth;
      const h = container.clientHeight;
      return Math.hypot((q.x * 0.5 + 0.5) * w - px, (-q.y * 0.5 + 0.5) * h - py);
    };

    const hitVector = (px: number, py: number): string | null => {
      const vectors = useAppStore.getState().customVectors3d;
      for (let i = vectors.length - 1; i >= 0; i--) {
        const v = vectors[i];
        const [x, y, z] = mul(display, v.x, v.y, v.z);
        if (screenDist(new THREE.Vector3(x, y, z), px, py) < HIT_RADIUS) return v.id;
      }
      return null;
    };

    const hitShape = (ndc: THREE.Vector2): { id: string; point: THREE.Vector3 } | null => {
      raycaster.setFromCamera(ndc, camera);
      const meshes = [...shapeViews.values()].map((v) => v.mesh);
      const hit = raycaster.intersectObjects(meshes, false)[0];
      if (!hit) return null;
      const id = hit.object.userData.shapeId as string | undefined;
      return id ? { id, point: hit.point.clone() } : null;
    };

    const cameraPlane = (through: THREE.Vector3) => {
      const normal = camera.getWorldDirection(new THREE.Vector3());
      return new THREE.Plane().setFromNormalAndCoplanarPoint(normal, through);
    };

    const planePoint = (ndc: THREE.Vector2, plane: THREE.Plane): THREE.Vector3 | null => {
      raycaster.setFromCamera(ndc, camera);
      return raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    };

    let drag: Drag = null;

    // Capture phase on the container so a hit can stop the event before
    // OrbitControls (listening on the canvas itself) starts rotating.
    const onPointerDown = (e: PointerEvent) => {
      if (locked() || e.button !== 0) return;
      const { px, py, ndc } = ndcOf(e);
      const st = useAppStore.getState();
      const inv = new Matrix3x3(display).inverse()?.values ?? null;

      const vectorId = hitVector(px, py);
      if (vectorId) {
        const v = st.customVectors3d.find((x) => x.id === vectorId)!;
        const [x, y, z] = mul(display, v.x, v.y, v.z);
        drag = { kind: 'vector', id: vectorId, inv, plane: cameraPlane(new THREE.Vector3(x, y, z)) };
      } else {
        const hit = hitShape(ndc);
        if (!hit) return;
        const shape = st.shapes3d.find((s) => s.id === hit.id)!;
        drag = {
          kind: 'shape',
          id: hit.id,
          inv,
          plane: cameraPlane(hit.point),
          startVertices: shape.vertices.map((p): [number, number, number] => [p[0], p[1], p[2]]),
          hit: hit.point,
        };
      }
      e.stopPropagation();
      renderer.domElement.setPointerCapture(e.pointerId);
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const { px, py, ndc } = ndcOf(e);
      if (drag) {
        if (!drag.inv) return; // matrix isn't invertible right now - no-op rather than NaN
        const p = planePoint(ndc, drag.plane);
        if (!p) return;
        if (drag.kind === 'vector') {
          const [x, y, z] = mul(drag.inv, p.x, p.y, p.z);
          useAppStore.getState().updateVector3d(drag.id, x, y, z);
        } else {
          const [dx, dy, dz] = mul(drag.inv, p.x - drag.hit.x, p.y - drag.hit.y, p.z - drag.hit.z);
          useAppStore.getState().setShapeVertices3d(
            drag.id,
            drag.startVertices.map((v): [number, number, number] => [v[0] + dx, v[1] + dy, v[2] + dz]),
          );
        }
        return;
      }
      if (locked()) {
        renderer.domElement.style.cursor = 'default';
        return;
      }
      const hovering = hitVector(px, py) !== null || hitShape(ndc) !== null;
      renderer.domElement.style.cursor = hovering ? 'grab' : 'default';
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!drag) return;
      drag = null;
      renderer.domElement.style.cursor = 'default';
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    };

    const resetCamera = () => {
      camera.position.copy(HOME_POSITION);
      controls.target.set(0, 0, 0);
      controls.update();
      dirty = true;
    };

    // Double-click deletes whatever vector/shape is under the cursor, or
    // resets the view if nothing is - the same escape hatch as 2D's zoom reset.
    const onDoubleClick = (e: MouseEvent) => {
      if (!locked()) {
        const { px, py, ndc } = ndcOf(e);
        const vectorId = hitVector(px, py);
        if (vectorId) {
          useAppStore.getState().removeVector3d(vectorId);
          return;
        }
        const shape = hitShape(ndc);
        if (shape) {
          useAppStore.getState().removeShape3d(shape.id);
          return;
        }
      }
      resetCamera();
    };

    container.addEventListener('pointerdown', onPointerDown, { capture: true });
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.addEventListener('dblclick', onDoubleClick);

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown, { capture: true });
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      container.removeEventListener('dblclick', onDoubleClick);
      controls.dispose();
      for (const d of deformables) d.dispose();
      for (const b of basis) b.dispose();
      for (const v of vectorViews.values()) { v.arrow.dispose(); v.ghostGeometry.dispose(); }
      for (const s of shapeViews.values()) s.dispose();
      unitSphere?.dispose();
      overlays.dispose();
      ghostMaterial.dispose();
      origin.geometry.dispose();
      (origin.material as THREE.Material).dispose();
      refGrid.geometry.dispose();
      refMaterial.dispose();
      for (const l of labels.values()) l.el.remove();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // GSAP tween triggered by Animate (and DecompositionPlayer) - identical to
  // the 2D canvas; only one of the two canvases is ever mounted.
  useEffect(() => {
    if (animTrigger === 0) return;
    const obj = { t: 0 };
    const tween = gsap.to(obj, {
      t: 1,
      duration: 1.4,
      ease: 'power2.inOut',
      onUpdate() { setAnimProgress(obj.t); },
      onComplete() { setAnimProgress(1); },
    });
    tweenRef.current = tween;
    return () => { tween.kill(); };
  }, [animTrigger, setAnimProgress]);

  // Manual scrubbing wins over an in-flight tween.
  useEffect(() => {
    if (isScrubbing) tweenRef.current?.kill();
  }, [isScrubbing]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <div ref={labelsRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
    </div>
  );
}
