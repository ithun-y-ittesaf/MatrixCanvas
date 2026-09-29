import type { Matrix2x2Values } from '../math/Matrix2x2';
import type { Matrix3x3Values } from '../math/Matrix3x3';

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

// ---------------------------------------------------------------------------
// 3D presets - the 3x3 counterparts of the list above (rotations about each
// axis, shears, plane reflections, projections), used in 3D mode.
// ---------------------------------------------------------------------------

export interface Preset3D {
  label: string;
  values: Matrix3x3Values;
}

const rotX = (a: number): Matrix3x3Values => {
  const c = parseFloat(Math.cos(a).toFixed(4));
  const s = parseFloat(Math.sin(a).toFixed(4));
  return [[1, 0, 0], [0, c, -s], [0, s, c]];
};
const rotY = (a: number): Matrix3x3Values => {
  const c = parseFloat(Math.cos(a).toFixed(4));
  const s = parseFloat(Math.sin(a).toFixed(4));
  return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
};
const rotZ = (a: number): Matrix3x3Values => {
  const c = parseFloat(Math.cos(a).toFixed(4));
  const s = parseFloat(Math.sin(a).toFixed(4));
  return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
};
const QUARTER = Math.PI / 2;
const EIGHTH = Math.PI / 4;

export const PRESETS_3D: Preset3D[] = [
  { label: 'Identity',              values: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  { label: 'Rotate X 45°',          values: rotX(EIGHTH) },
  { label: 'Rotate Y 45°',          values: rotY(EIGHTH) },
  { label: 'Rotate Z 45°',          values: rotZ(EIGHTH) },
  { label: 'Rotate X 90°',          values: rotX(QUARTER) },
  { label: 'Rotate Y 90°',          values: rotY(QUARTER) },
  { label: 'Rotate Z 90°',          values: rotZ(QUARTER) },
  { label: 'Rotate 120° about (1,1,1)', values: [[0, 0, 1], [1, 0, 0], [0, 1, 0]] },
  { label: 'Scale ×2',              values: [[2, 0, 0], [0, 2, 0], [0, 0, 2]] },
  { label: 'Stretch (2, 1, 0.5)',   values: [[2, 0, 0], [0, 1, 0], [0, 0, 0.5]] },
  { label: 'Shear X by Y',          values: [[1, 1, 0], [0, 1, 0], [0, 0, 1]] },
  { label: 'Shear X by Z',          values: [[1, 0, 1], [0, 1, 0], [0, 0, 1]] },
  { label: 'Shear Y by Z',          values: [[1, 0, 0], [0, 1, 1], [0, 0, 1]] },
  { label: 'Reflect over XY plane', values: [[1, 0, 0], [0, 1, 0], [0, 0, -1]] },
  { label: 'Reflect over XZ plane', values: [[1, 0, 0], [0, -1, 0], [0, 0, 1]] },
  { label: 'Reflect over YZ plane', values: [[-1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  { label: 'Project onto XY plane', values: [[1, 0, 0], [0, 1, 0], [0, 0, 0]] },
  { label: 'Project onto X axis',   values: [[1, 0, 0], [0, 0, 0], [0, 0, 0]] },
];
