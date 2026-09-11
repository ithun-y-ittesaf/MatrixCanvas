import { create } from 'zustand';
import type { Matrix2x2Values } from '../math/Matrix2x2';
import type { Lesson, LessonStep } from '../lessons/types';
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

interface AppStore {
  matrixValues: Matrix2x2Values;
  // 0 = identity, 1 = fully transformed (live as user types)
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
  setAnimProgress: (t: number) => void;
  setIsScrubbing: (scrubbing: boolean) => void;
  triggerAnimation: () => void;
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
  activeLesson: Lesson | null;
  activeStepIndex: number;
  startLesson: (lesson: Lesson) => void;
  nextStep: () => void;
  prevStep: () => void;
  exitLesson: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  matrixValues: [[1, 0], [0, 1]],
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

  setMatrixValues: (values) => set({ matrixValues: values }),

  setAnimProgress: (t) => set({ animProgress: t }),

  setIsScrubbing: (scrubbing) => set({ isScrubbing: scrubbing }),

  triggerAnimation: () =>
    set((state) => ({
      animProgress: 0,
      animTrigger: state.animTrigger + 1,
      // A fresh Animate click always wins over a stale scrub session (e.g.
      // one where pointerup fired outside the slider).
      isScrubbing: false,
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
    set({ activeLesson: lesson, activeStepIndex: 0 });
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
  exitLesson: () =>
    set({
      activeLesson: null,
      activeStepIndex: 0,
      matrixValues: [[1, 0], [0, 1]],
      customVectors: [],
      shapes: [],
      nextSeq: 0,
    }),
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
function applyLessonStep(store: AppStore, step: LessonStep): void {
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
