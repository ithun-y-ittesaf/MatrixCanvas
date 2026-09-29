import { create } from 'zustand';
import type { Matrix2x2Values } from '../math/Matrix2x2';
import type { Matrix3x3Values } from '../math/Matrix3x3';
import {
  isLesson3D,
  type AnyLesson,
  type AnyLessonStep,
  type LessonStep3D,
} from '../lessons/types';
import { VECTOR_COLORS } from '../theme';

export interface CustomVector {
  id: string;
  x: number;
  y: number;
  color: string;
  // Creation order, shared with TransformableShape.seq — lets the sidebar
  // merge vectors and shapes into one Desmos-style expression list ordered
  // by when each item was added, and lets addVector/addShape draw from one
  // shared color cycle so two items never collide on color regardless of
  // which kind they are.
  seq: number;
}

export type ShapeType = 'rectangle' | 'triangle' | 'polygon';

export interface TransformableShape {
  id: string;
  type: ShapeType;
  // Vertices in original, untransformed space.
  vertices: [number, number][];
  color: string;
  seq: number;
}

// Preset vertex sets, centered on the origin so transforms like scale and
// rotation behave predictably. Used to offer one-click shape presets, the
// same way PRESETS in utils/presets.ts offers matrix presets.
export function rectanglePresetVertices(): [number, number][] {
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];
}

export function trianglePresetVertices(): [number, number][] {
  return [
    [0, 1],
    [-1, -1],
    [1, -1],
  ];
}

export type Mode = '2d' | '3d';

export interface CustomVector3d {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  seq: number;
}

// cube: 8 corners in bit order (index = x + 2y + 4z); pyramid: 4 base corners
// then the apex; sphere: [center] plus `radius`.
export type ShapeType3d = 'cube' | 'pyramid' | 'sphere';

export interface TransformableShape3d {
  id: string;
  type: ShapeType3d;
  // Vertices in original, untransformed space.
  vertices: [number, number, number][];
  radius?: number;
  color: string;
  seq: number;
}

// Geometric extras the 3D canvas can draw, all derived from the current matrix:
// the unit sphere and its ellipsoid image, eigenvector lines, null space (line
// or plane), column space (line or plane), and the ellipsoid's singular axes.
export type Overlay3d =
  | 'unitSphere'
  | 'eigenvectors'
  | 'nullSpace'
  | 'columnSpace'
  | 'singularAxes';

export function cubePresetVertices(half = 1): [number, number, number][] {
  const v: [number, number, number][] = [];
  for (let i = 0; i < 8; i++) {
    v.push([
      (i & 1 ? 1 : -1) * half,
      (i & 2 ? 1 : -1) * half,
      (i & 4 ? 1 : -1) * half,
    ]);
  }
  return v;
}

export function pyramidPresetVertices(): [number, number, number][] {
  return [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [0, 0, 1],
  ];
}

interface AppStore {
  // Which playground/lessons dimension is showing. The 2D and 3D state below
  // are kept fully separate so toggling never clobbers the other side; the
  // animation scalars (animProgress/animTrigger/isScrubbing) are shared since
  // only one canvas is mounted at a time.
  mode: Mode;
  setMode: (mode: Mode) => void;
  matrixValues: Matrix2x2Values;
  matrixValues3d: Matrix3x3Values;
  animFrom3d: Matrix3x3Values;
  customVectors3d: CustomVector3d[];
  shapes3d: TransformableShape3d[];
  overlays3d: Overlay3d[];
  // Matrix animProgress=0 corresponds to. Almost always the identity (every
  // tween in the app animates identity -> matrixValues) except mid-sequence
  // in DecompositionPlayer, which points this at the previous stop so it can
  // tween stop-to-stop instead of always snapping back to identity.
  animFrom: Matrix2x2Values;
  // 0 = animFrom, 1 = fully transformed (live as user types)
  animProgress: number;
  // incremented each time "Animate" is clicked to re-trigger the tween
  animTrigger: number;
  // true while the user is dragging the scrub slider — lets the GSAP tween
  // driver know to back off and not fight manual scrubbing
  isScrubbing: boolean;
  customVectors: CustomVector[];
  shapes: TransformableShape[];
  // Shared creation-order/color-cycle counter — see CustomVector.seq.
  nextSeq: number;

  setMatrixValue: (row: 0 | 1, col: 0 | 1, value: number) => void;
  setMatrixValues: (values: Matrix2x2Values) => void;
  setMatrixValue3d: (row: 0 | 1 | 2, col: 0 | 1 | 2, value: number) => void;
  setMatrixValues3d: (values: Matrix3x3Values) => void;
  setAnimProgress: (t: number) => void;
  setIsScrubbing: (scrubbing: boolean) => void;
  triggerAnimation: () => void;
  // Same as triggerAnimation, but tweens `from` -> `to` instead of always
  // starting from identity. Lets a caller (DecompositionPlayer) chain several
  // stop-to-stop tweens through the same GSAP-driven mechanism TransformCanvas
  // already listens to (animFrom/matrixValues/animProgress/animTrigger),
  // rather than building a parallel animation system.
  triggerAnimationFrom: (from: Matrix2x2Values, to: Matrix2x2Values) => void;
  triggerAnimationFrom3d: (from: Matrix3x3Values, to: Matrix3x3Values) => void;

  addVector3d: (x: number, y: number, z: number) => void;
  removeVector3d: (id: string) => void;
  updateVector3d: (id: string, x: number, y: number, z: number) => void;
  clearVectors3d: () => void;
  addShape3d: (
    type: ShapeType3d,
    vertices: [number, number, number][],
    radius?: number,
  ) => void;
  removeShape3d: (id: string) => void;
  setShapeVertices3d: (id: string, vertices: [number, number, number][]) => void;
  clearShapes3d: () => void;
  setOverlays3d: (overlays: Overlay3d[]) => void;
  toggleOverlay3d: (overlay: Overlay3d) => void;

  addVector: (x: number, y: number) => void;
  removeVector: (id: string) => void;
  updateVector: (id: string, x: number, y: number) => void;
  addShape: (type: ShapeType, vertices: [number, number][]) => void;
  removeShape: (id: string) => void;
  addPolygonVertex: (shapeId: string, vertex: [number, number]) => void;
  // Replaces a shape's whole vertex list — used to drag a shape as a rigid
  // body (every vertex shifted by the same world-space delta) without
  // accumulating float error across many small per-frame updates.
  setShapeVertices: (shapeId: string, vertices: [number, number][]) => void;
  clearShapes: () => void;
  clearVectors: () => void;

  // Lesson engine slice. The active lesson/step live here rather than on a
  // Lesson class instance (per the proposal's class diagram) so the rest of
  // the app can just subscribe to the store like it does for everything
  // else; applyLessonStep below is the applyStep(n) from that diagram.
  activeLesson: AnyLesson | null;
  activeStepIndex: number;
  // Starting a lesson also switches `mode` to the lesson's dimension.
  startLesson: (lesson: AnyLesson) => void;
  nextStep: () => void;
  prevStep: () => void;
  exitLesson: () => void;
}

const IDENTITY_VALUES: Matrix2x2Values = [[1, 0], [0, 1]];
const IDENTITY_VALUES_3D: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// A direct load of a `?mode=3d` link starts in 3D, so the 2D canvas is never
// mounted just to be swapped out. (In-app arrivals - the /3d redirect - are
// handled by PlaygroundPage.)
function initialMode(): Mode {
  try {
    return new URLSearchParams(window.location.search).get('mode') === '3d' ? '3d' : '2d';
  } catch {
    return '2d'; // no window (node test environment)
  }
}

export const useAppStore = create<AppStore>((set, get) => ({
  mode: initialMode(),
  matrixValues: [[1, 0], [0, 1]],
  matrixValues3d: IDENTITY_VALUES_3D,
  animFrom3d: IDENTITY_VALUES_3D,
  customVectors3d: [],
  shapes3d: [],
  overlays3d: [],
  animFrom: IDENTITY_VALUES,
  animProgress: 1,
  animTrigger: 0,
  isScrubbing: false,
  customVectors: [],
  shapes: [],
  nextSeq: 0,
  activeLesson: null,
  activeStepIndex: 0,

  setMatrixValue: (row, col, value) =>
    set((state) => {
      const next: Matrix2x2Values = [
        [...state.matrixValues[0]] as [number, number],
        [...state.matrixValues[1]] as [number, number],
      ];
      next[row][col] = value;
      return { matrixValues: next };
    }),

  setMode: (mode) => set({ mode }),

  setMatrixValues: (values) => set({ matrixValues: values }),

  setMatrixValue3d: (row, col, value) =>
    set((state) => {
      const next: Matrix3x3Values = [
        [...state.matrixValues3d[0]] as [number, number, number],
        [...state.matrixValues3d[1]] as [number, number, number],
        [...state.matrixValues3d[2]] as [number, number, number],
      ];
      next[row][col] = value;
      return { matrixValues3d: next };
    }),

  setMatrixValues3d: (values) => set({ matrixValues3d: values }),

  setAnimProgress: (t) => set({ animProgress: t }),

  setIsScrubbing: (scrubbing) => set({ isScrubbing: scrubbing }),

  triggerAnimation: () =>
    set((state) => ({
      // The Animate button always tweens identity -> matrixValues; reset
      // animFrom here too in case something (e.g. DecompositionPlayer) left
      // it pointed at a mid-sequence stop.
      animFrom: IDENTITY_VALUES,
      animFrom3d: IDENTITY_VALUES_3D,
      animProgress: 0,
      animTrigger: state.animTrigger + 1,
      // A fresh Animate click always wins over a stale scrub session (e.g.
      // one where pointerup fired outside the slider).
      isScrubbing: false,
    })),

  triggerAnimationFrom: (from, to) =>
    set((state) => ({
      animFrom: from,
      matrixValues: to,
      animProgress: 0,
      animTrigger: state.animTrigger + 1,
      isScrubbing: false,
    })),

  triggerAnimationFrom3d: (from, to) =>
    set((state) => ({
      animFrom3d: from,
      matrixValues3d: to,
      animProgress: 0,
      animTrigger: state.animTrigger + 1,
      isScrubbing: false,
    })),

  addVector3d: (x, y, z) =>
    set((state) => ({
      customVectors3d: [
        ...state.customVectors3d,
        {
          id: crypto.randomUUID(),
          x,
          y,
          z,
          color: VECTOR_COLORS[state.nextSeq % VECTOR_COLORS.length],
          seq: state.nextSeq,
        },
      ],
      nextSeq: state.nextSeq + 1,
    })),

  removeVector3d: (id) =>
    set((state) => ({
      customVectors3d: state.customVectors3d.filter((v) => v.id !== id),
    })),

  updateVector3d: (id, x, y, z) =>
    set((state) => ({
      customVectors3d: state.customVectors3d.map((v) =>
        v.id === id ? { ...v, x, y, z } : v
      ),
    })),

  clearVectors3d: () => set({ customVectors3d: [] }),

  addShape3d: (type, vertices, radius) =>
    set((state) => ({
      shapes3d: [
        ...state.shapes3d,
        {
          id: crypto.randomUUID(),
          type,
          vertices,
          ...(radius !== undefined ? { radius } : {}),
          color: VECTOR_COLORS[state.nextSeq % VECTOR_COLORS.length],
          seq: state.nextSeq,
        },
      ],
      nextSeq: state.nextSeq + 1,
    })),

  removeShape3d: (id) =>
    set((state) => ({ shapes3d: state.shapes3d.filter((s) => s.id !== id) })),

  setShapeVertices3d: (id, vertices) =>
    set((state) => ({
      shapes3d: state.shapes3d.map((s) => (s.id === id ? { ...s, vertices } : s)),
    })),

  clearShapes3d: () => set({ shapes3d: [] }),

  setOverlays3d: (overlays) => set({ overlays3d: overlays }),

  toggleOverlay3d: (overlay) =>
    set((state) => ({
      overlays3d: state.overlays3d.includes(overlay)
        ? state.overlays3d.filter((o) => o !== overlay)
        : [...state.overlays3d, overlay],
    })),

  addVector: (x, y) =>
    set((state) => ({
      customVectors: [
        ...state.customVectors,
        {
          id: crypto.randomUUID(),
          x,
          y,
          color: VECTOR_COLORS[state.nextSeq % VECTOR_COLORS.length],
          seq: state.nextSeq,
        },
      ],
      nextSeq: state.nextSeq + 1,
    })),

  removeVector: (id) =>
    set((state) => ({
      customVectors: state.customVectors.filter((v) => v.id !== id),
    })),

  updateVector: (id, x, y) =>
    set((state) => ({
      customVectors: state.customVectors.map((v) =>
        v.id === id ? { ...v, x, y } : v
      ),
    })),

  addShape: (type, vertices) =>
    set((state) => ({
      shapes: [
        ...state.shapes,
        {
          id: crypto.randomUUID(),
          type,
          vertices,
          color: VECTOR_COLORS[state.nextSeq % VECTOR_COLORS.length],
          seq: state.nextSeq,
        },
      ],
      nextSeq: state.nextSeq + 1,
    })),

  removeShape: (id) =>
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
    })),

  addPolygonVertex: (shapeId, vertex) =>
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === shapeId ? { ...s, vertices: [...s.vertices, vertex] } : s
      ),
    })),

  setShapeVertices: (shapeId, vertices) =>
    set((state) => ({
      shapes: state.shapes.map((s) => (s.id === shapeId ? { ...s, vertices } : s)),
    })),

  clearShapes: () => set({ shapes: [] }),
  clearVectors: () => set({ customVectors: [] }),

  startLesson: (lesson) => {
    set({
      activeLesson: lesson,
      activeStepIndex: 0,
      mode: isLesson3D(lesson) ? '3d' : '2d',
    });
    const firstStep = lesson.steps[0];
    if (firstStep) applyLessonStep(get(), firstStep);
  },

  nextStep: () => {
    const { activeLesson, activeStepIndex } = get();
    if (!activeLesson) return;
    const nextIndex = activeStepIndex + 1;
    const step = activeLesson.steps[nextIndex];
    if (!step) return; // already on the last step
    set({ activeStepIndex: nextIndex });
    applyLessonStep(get(), step);
  },

  prevStep: () => {
    const { activeLesson, activeStepIndex } = get();
    if (!activeLesson) return;
    const prevIndex = activeStepIndex - 1;
    const step = activeLesson.steps[prevIndex];
    if (!step) return; // already on the first step
    set({ activeStepIndex: prevIndex });
    applyLessonStep(get(), step);
  },

  // Exiting drops the lesson slice *and* resets the canvas back to a blank
  // playground (identity matrix, no vectors/shapes) rather than leaving
  // whatever the last active step had loaded — otherwise free-play mode
  // would start out contaminated with leftover lesson state.
  // Only the dimension the lesson was using is reset, so leaving a 2D lesson
  // doesn't wipe a 3D playground someone had set up (and vice versa).
  exitLesson: () => {
    const lesson = get().activeLesson;
    const was3d = lesson !== null && isLesson3D(lesson);
    set({
      activeLesson: null,
      activeStepIndex: 0,
      nextSeq: 0,
      ...(was3d
        ? {
            matrixValues3d: IDENTITY_VALUES_3D,
            animFrom3d: IDENTITY_VALUES_3D,
            customVectors3d: [],
            shapes3d: [],
            overlays3d: [],
          }
        : {
            matrixValues: IDENTITY_VALUES,
            // In case a decomposition-track step left this pointed at a mid-
            // sequence stop (see triggerAnimationFrom / DecompositionPlayer).
            animFrom: IDENTITY_VALUES,
            customVectors: [],
            shapes: [],
          }),
    });
  },
}));

// Pushes a lesson step's matrix/vectors/shapes into the shared playground
// state via the store's own public setters (setMatrixValues/addVector/
// addShape) — same pattern urlState.ts's hydrateStoreFromSearchParams uses
// to drive the canvas from an external source. This is what satisfies FR-7
// ("programmatically control the canvas state"): TransformCanvas and the
// rest of the Playground UI just read matrixValues/customVectors/shapes as
// usual and have no idea a lesson is driving them.
//
// Vectors/shapes are fully replaced (not merged) on every step, so a step
// that omits `vectors`/`shapes` clears whatever the previous step loaded.
//
// For a step with `decomposition` set, this still sets matrixValues to the
// step's (fully transformed) matrix as a sane at-rest default — but
// LessonRunner mounts a DecompositionPlayer for that step, and its own
// mount effect immediately takes over via triggerAnimationFrom, resetting
// the canvas to the identity start of that decomposition's stop sequence.
function applyLessonStep(store: AppStore, step: AnyLessonStep): void {
  if (is3DStep(step)) {
    store.setMatrixValues3d(step.matrix);
    // A step starts fully transformed, not mid-tween from a previous step.
    useAppStore.setState({ animFrom3d: IDENTITY_VALUES_3D });
    store.clearVectors3d();
    store.clearShapes3d();
    store.setOverlays3d(step.overlays ?? []);
    useAppStore.setState({ nextSeq: 0 });
    for (const v of step.vectors ?? []) store.addVector3d(v.x, v.y, v.z);
    for (const s of step.shapes ?? []) store.addShape3d(s.type, s.vertices, s.radius);
    return;
  }

  store.setMatrixValues(step.matrix);

  store.clearVectors();
  store.clearShapes();
  // Reset the shared color-cycle counter so a step's first item always
  // lands on the same color as any other step's first item, rather than
  // drifting further into the palette the deeper into a lesson you get.
  useAppStore.setState({ nextSeq: 0 });
  for (const v of step.vectors ?? []) store.addVector(v.x, v.y);
  for (const s of step.shapes ?? []) store.addShape(s.type, s.vertices);
}

// A 3D step's matrix is 3 rows tall; 2D steps' is 2.
function is3DStep(step: AnyLessonStep): step is LessonStep3D {
  return step.matrix.length === 3;
}
