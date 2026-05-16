import type { Matrix2x2Values } from '../math/Matrix2x2';

export interface Preset {
  label: string;
  values: Matrix2x2Values;
}

const cos45 = parseFloat(Math.cos(Math.PI / 4).toFixed(4));
const sin45 = parseFloat(Math.sin(Math.PI / 4).toFixed(4));

export const PRESETS: Preset[] = [
  { label: 'Identity',          values: [[1, 0], [0, 1]] },
  { label: 'Rotate 45°',        values: [[cos45, -sin45], [sin45, cos45]] },
  { label: 'Rotate 90°',        values: [[0, -1], [1, 0]] },
  { label: 'Horizontal Shear',  values: [[1, 1], [0, 1]] },
  { label: 'Vertical Shear',    values: [[1, 0], [1, 1]] },
  { label: 'Scale ×2',          values: [[2, 0], [0, 2]] },
  { label: 'Reflect over X',    values: [[1, 0], [0, -1]] },
  { label: 'Reflect over Y=X',  values: [[0, 1], [1, 0]] },
  { label: 'Project onto X',    values: [[1, 0], [0, 0]] },
];
