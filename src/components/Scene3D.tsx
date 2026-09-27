import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Basis colors mirror COLOR_BASIS_X/Y in src/theme.ts (red = x, blue = y);
// z has no 2D equivalent, so it borrows the first entry of VECTOR_COLORS.
const COLOR_X = 0xf87171;
const COLOR_Y = 0x60a5fa;
const COLOR_Z = 0x34d399;
const COLOR_BG = 0x0a0b12;
const COLOR_GRID = 0x2a2c3d;
const COLOR_CUBE = 0x6366f1;

const AXIS_LENGTH = 3;

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

// Standalone proof of the rendering pipeline: an orbit-controlled scene with
// a coordinate grid/axes and a single unit cube. No matrix wiring yet — this
// just establishes that Three.js renders correctly alongside the existing
// 2D canvas.
export default function Scene3D() {
  const containerRef = useRef<HTMLDivElement>(null);

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

    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: COLOR_CUBE, transparent: true, opacity: 0.85 }),
    );
    scene.add(cube);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(cube.geometry),
      new THREE.LineBasicMaterial({ color: 0xeef0f8 }),
    );
    cube.add(edges);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(4, 6, 5);
    scene.add(directional);

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
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      cube.geometry.dispose();
      (cube.material as THREE.Material).dispose();
      edges.geometry.dispose();
      (edges.material as THREE.Material).dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
