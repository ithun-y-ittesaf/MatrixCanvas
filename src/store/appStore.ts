import { create } from 'zustand';
import type { Matrix2x2Values } from '../math/Matrix2x2';
import type { Lesson, LessonStep } from '../lessons/types';

export interface CustomVector {
  id: string;
  x: number;
  y: number;
  color: string;
}

export type ShapeType = 'rectangle' | 'triangle' | 'polygon';

export interface TransformableShape {
  id: string;
  type: ShapeType;
  // Vertices in original, untransformed space.
  vertices: [number, number][];
  color: string;
}

const VECTOR_COLORS = ['#facc15', '#34d399', '#c084fc', '#fb923c', '#22d3ee', '#f472b6'];

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

  setMatrixValue: (row: 0 | 1, col: 0 | 1, value: number) => void;
  setMatrixValues: (values: Matrix2x2Values) => void;
  setAnimProgress: (t: number) => void;
  setIsScrubbing: (scrubbing: boolean) => void;
  triggerAnimation: () => void;
  // Same as triggerAnimation, but tweens `from` -> `to` instead of always
  // starting from identity. Lets a caller (DecompositionPlayer) chain several
  // stop-to-stop tweens through the same GSAP-driven mechanism TransformCanvas
  // already listens to (animFrom/matrixValues/animProgress/animTrigger),
  // rather than building a parallel animation system.
  triggerAnimationFrom: (from: Matrix2x2Values, to: Matrix2x2Values) => void;
  addVector: (x: number, y: number) => void;
  removeVector: (id: string) => void;
  updateVector: (id: string, x: number, y: number) => void;
  addShape: (type: ShapeType, vertices: [number, number][]) => void;
  removeShape: (id: string) => void;
  addPolygonVertex: (shapeId: string, vertex: [number, number]) => void;
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

const IDENTITY_VALUES: Matrix2x2Values = [[1, 0], [0, 1]];

export const useAppStore = create<AppStore>((set, get) => ({
  matrixValues: [[1, 0], [0, 1]],
  animFrom: IDENTITY_VALUES,
  animProgress: 1,
  animTrigger: 0,
  isScrubbing: false,
  customVectors: [],
  shapes: [],
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
      // The Animate button always tweens identity -> matrixValues; reset
      // animFrom here too in case something (e.g. DecompositionPlayer) left
      // it pointed at a mid-sequence stop.
      animFrom: IDENTITY_VALUES,
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

  addVector: (x, y) =>
    set((state) => ({
      customVectors: [
        ...state.customVectors,
        {
          id: crypto.randomUUID(),
          x,
          y,
          color: VECTOR_COLORS[state.customVectors.length % VECTOR_COLORS.length],
        },
      ],
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
          // Offset from customVectors' cycling start so the first vector and
          // the first shape don't land on the same color.
          color: VECTOR_COLORS[(state.shapes.length + 3) % VECTOR_COLORS.length],
        },
      ],
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
      matrixValues: IDENTITY_VALUES,
      // In case a decomposition-track step left this pointed at a mid-
      // sequence stop (see triggerAnimationFrom / DecompositionPlayer).
      animFrom: IDENTITY_VALUES,
      customVectors: [],
      shapes: [],
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
//
// For a step with `decomposition` set, this still sets matrixValues to the
// step's (fully transformed) matrix as a sane at-rest default — but
// LessonRunner mounts a DecompositionPlayer for that step, and its own
// mount effect immediately takes over via triggerAnimationFrom, resetting
// the canvas to the identity start of that decomposition's stop sequence.
function applyLessonStep(store: AppStore, step: LessonStep): void {
  store.setMatrixValues(step.matrix);

  store.clearVectors();
  for (const v of step.vectors ?? []) store.addVector(v.x, v.y);

  store.clearShapes();
  for (const s of step.shapes ?? []) store.addShape(s.type, s.vertices);
}
