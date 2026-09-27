import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useAppStore } from '../store/appStore';
import { Matrix3x3 } from '../math/Matrix3x3';

// Basis colors mirror COLOR_BASIS_X/Y in src/theme.ts (red = x, blue = y);
// z has no 2D equivalent, so it borrows the first entry of VECTOR_COLORS.
const COLOR_X = 0xf87171;
const COLOR_Y = 0x60a5fa;
const COLOR_Z = 0x34d399;
const COLOR_BG = 0x0a0b12;
const COLOR_GRID = 0x2a2c3d;
const COLOR_CUBE = 0x6366f1;
const COLOR_VECTOR = 0xfacc15;

const AXIS_LENGTH = 3;

// The 8 corners of a unit cube centered on the origin, indexed as
// x + 2y + 4z (each coordinate 0 -> -0.5, 1 -> +0.5) — matching the
// CUBE_TRIANGLES/CUBE_EDGES index lists below. Kept as the untransformed
// basis so each frame's deform is `matrix.multiply(BASE_CORNERS[i])`, never
// accumulated onto the previous frame's already-transformed positions.
const BASE_CORNERS: [number, number, number][] = [
  [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5],
  [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, 0.5, 0.5],
];

// Two triangles per face, wound so cross(v1-v0, v2-v0) points outward.
const CUBE_TRIANGLES = new Uint16Array([
  1, 3, 7, 1, 7, 5, // +x
  0, 4, 6, 0, 6, 2, // -x
  2, 6, 7, 2, 7, 3, // +y
  0, 1, 5, 0, 5, 4, // -y
  4, 5, 7, 4, 7, 6, // +z
  0, 2, 3, 0, 3, 1, // -z
]);

const CUBE_EDGES = new Uint16Array([
  0, 1, 0, 2, 0, 4, 1, 3, 1, 5, 2, 3,
  2, 6, 3, 7, 4, 5, 4, 6, 5, 7, 6, 7,
]);

// The vector rendered alongside the cube — its transform under the current
// matrix is exactly `matrixValues3d * BASE_VECTOR`.
const BASE_VECTOR = new THREE.Vector3(1, 1, 1);

function buildAxes(): THREE.Object3D {
  const group = new THREE.Group();
  const axes: [THREE.Vector3, number][] = [
    [new THREE.Vector3(AXIS_LENGTH, 0, 0), COLOR_X],
    [new THREE.Vector3(0, AXIS_LENGTH, 0), COLOR_Y],
    [new THREE.Vector3(0, 0, AXIS_LENGTH), COLOR_Z],
  ];
  for (const [end, color] of axes) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      end.clone().negate(),
      end,
    ]);
    group.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ color })));
  }
  return group;
}

interface DeformRefs {
  cubePositions: THREE.BufferAttribute;
  cubeGeometry: THREE.BufferGeometry;
  arrow: THREE.ArrowHelper;
}

// Applies `matrix` to the cube's 8 corners and the rendered vector — the only
// thing that changes frame-to-frame; scene/camera/renderer setup happens once
// in the mount effect below.
function applyMatrix(matrix: Matrix3x3, refs: DeformRefs) {
  const { cubePositions, cubeGeometry, arrow } = refs;
  for (let i = 0; i < BASE_CORNERS.length; i++) {
    const [x, y, z] = matrix.multiply(BASE_CORNERS[i]);
    cubePositions.setXYZ(i, x, y, z);
  }
  cubePositions.needsUpdate = true;
  cubeGeometry.computeVertexNormals();
  cubeGeometry.computeBoundingSphere();

  const [vx, vy, vz] = matrix.multiply([BASE_VECTOR.x, BASE_VECTOR.y, BASE_VECTOR.z]);
  const transformed = new THREE.Vector3(vx, vy, vz);
  const length = transformed.length();
  if (length > 1e-6) {
    arrow.visible = true;
    arrow.setDirection(transformed.clone().normalize());
    arrow.setLength(length, Math.min(0.3, length * 0.3), Math.min(0.15, length * 0.15));
  } else {
    arrow.visible = false;
  }
}

// Orbit-controlled Three.js scene: a coordinate grid/axes, a unit cube, and a
// vector from the origin, both deformed in real time by the store's
// matrixValues3d — the 3D analogue of the 2D Playground's "deform in real
// time" behavior (FR-2/FR-9).
export default function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const deformRef = useRef<DeformRefs | null>(null);
  const matrixValues3d = useAppStore((s) => s.matrixValues3d);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLOR_BG);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;

    const grid = new THREE.GridHelper(10, 10, COLOR_GRID, COLOR_GRID);
    scene.add(grid);
    scene.add(buildAxes());

    const cubeGeometry = new THREE.BufferGeometry();
    const cubePositions = new THREE.BufferAttribute(new Float32Array(BASE_CORNERS.length * 3), 3);
    cubeGeometry.setAttribute('position', cubePositions);
    cubeGeometry.setIndex(new THREE.BufferAttribute(CUBE_TRIANGLES, 1));
    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: COLOR_CUBE,
      transparent: true,
      opacity: 0.85,
      flatShading: true,
      side: THREE.DoubleSide,
    });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    scene.add(cube);

    // Shares the same position attribute as the cube mesh — one
    // needsUpdate flip in applyMatrix keeps both in sync.
    const edgesGeometry = new THREE.BufferGeometry();
    edgesGeometry.setAttribute('position', cubePositions);
    edgesGeometry.setIndex(new THREE.BufferAttribute(CUBE_EDGES, 1));
    const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xeef0f8 });
    const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    scene.add(edges);

    const arrow = new THREE.ArrowHelper(
      BASE_VECTOR.clone().normalize(),
      new THREE.Vector3(0, 0, 0),
      BASE_VECTOR.length(),
      COLOR_VECTOR,
      0.3,
      0.15,
    );
    scene.add(arrow);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(4, 6, 5);
    scene.add(directional);

    deformRef.current = { cubePositions, cubeGeometry, arrow };
    applyMatrix(new Matrix3x3(useAppStore.getState().matrixValues3d), deformRef.current);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      deformRef.current = null;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      cubeGeometry.dispose();
      cubeMaterial.dispose();
      edgesGeometry.dispose();
      edgesMaterial.dispose();
      // Not arrow.dispose(): ArrowHelper's line/cone geometries are shared,
      // module-level statics in three.js (only ever created once) — its
      // dispose() disposes those globally, which would break every
      // ArrowHelper created afterward (e.g. on remounting this component).
      // Only the per-instance materials are actually ours to dispose.
      (arrow.line.material as THREE.Material).dispose();
      (arrow.cone.material as THREE.Material).dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  // Live deform: re-applies the current matrix to the cube/vector whenever
  // the store's matrixValues3d changes, without touching the scene/camera/
  // renderer set up above.
  useEffect(() => {
    if (!deformRef.current) return;
    applyMatrix(new Matrix3x3(matrixValues3d), deformRef.current);
  }, [matrixValues3d]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
