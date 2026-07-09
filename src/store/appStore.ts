import { create } from 'zustand';
import type { Matrix2x2Values } from '../math/Matrix2x2';

export interface CustomVector {
  id: string;
  x: number;
  y: number;
  color: string;
}

const VECTOR_COLORS = ['#facc15', '#34d399', '#c084fc', '#fb923c', '#22d3ee', '#f472b6'];

interface AppStore {
  matrixValues: Matrix2x2Values;
  // 0 = identity, 1 = fully transformed (live as user types)
  animProgress: number;
  // incremented each time "Animate" is clicked to re-trigger the tween
  animTrigger: number;
  customVectors: CustomVector[];

  setMatrixValue: (row: 0 | 1, col: 0 | 1, value: number) => void;
  setMatrixValues: (values: Matrix2x2Values) => void;
  setAnimProgress: (t: number) => void;
  triggerAnimation: () => void;
  addVector: (x: number, y: number) => void;
  removeVector: (id: string) => void;
  updateVector: (id: string, x: number, y: number) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  matrixValues: [[1, 0], [0, 1]],
  animProgress: 1,
  animTrigger: 0,
  customVectors: [],

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
}));
