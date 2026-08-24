import { create } from 'zustand';
import type { Matrix2x2Values } from '../math/Matrix2x2';

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
  // 0 = identity, 1 = fully transformed (live as user types)
  animProgress: number;
  // incremented each time "Animate" is clicked to re-trigger the tween
  animTrigger: number;
  customVectors: CustomVector[];
  shapes: TransformableShape[];

  setMatrixValue: (row: 0 | 1, col: 0 | 1, value: number) => void;
  setMatrixValues: (values: Matrix2x2Values) => void;
  setAnimProgress: (t: number) => void;
  triggerAnimation: () => void;
  addVector: (x: number, y: number) => void;
  removeVector: (id: string) => void;
  updateVector: (id: string, x: number, y: number) => void;
  addShape: (type: ShapeType, vertices: [number, number][]) => void;
  removeShape: (id: string) => void;
  addPolygonVertex: (shapeId: string, vertex: [number, number]) => void;
  clearShapes: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  matrixValues: [[1, 0], [0, 1]],
  animProgress: 1,
  animTrigger: 0,
  customVectors: [],
  shapes: [],

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

  triggerAnimation: () =>
    set((state) => ({
      animProgress: 0,
      animTrigger: state.animTrigger + 1,
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
}));
