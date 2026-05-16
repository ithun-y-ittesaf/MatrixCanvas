import { create } from 'zustand';
import type { Matrix2x2Values } from '../math/Matrix2x2';

interface AppStore {
  matrixValues: Matrix2x2Values;
  // 0 = identity, 1 = fully transformed (live as user types)
  animProgress: number;
  // incremented each time "Animate" is clicked to re-trigger the tween
  animTrigger: number;

  setMatrixValue: (row: 0 | 1, col: 0 | 1, value: number) => void;
  setMatrixValues: (values: Matrix2x2Values) => void;
  setAnimProgress: (t: number) => void;
  triggerAnimation: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  matrixValues: [[1, 0], [0, 1]],
  animProgress: 1,
  animTrigger: 0,

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
}));
