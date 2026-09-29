import type { Matrix3x3Values } from '../math/Matrix3x3';
import { PRESETS_3D } from '../utils/presets';
import { cubePresetVertices } from '../store/appStore';
import type { LessonShape3D, LessonVector3D } from '../lessons/types';

export const IDENTITY_3: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

// Looks a 3D preset up by its label in utils/presets.ts, so lesson content
// stays in sync with the Playground's Presets menu (same idea as the 2D
// lessons/presetValues.ts). Throws on a typo so it's caught by the tests, not
// by a learner.
export function preset3d(label: string): Matrix3x3Values {
  const found = PRESETS_3D.find((p) => p.label === label);
  if (!found) throw new Error(`Unknown 3D preset: ${label}`);
  return found.values;
}

export const E1: LessonVector3D = { x: 1, y: 0, z: 0 };
export const E2: LessonVector3D = { x: 0, y: 1, z: 0 };
export const E3: LessonVector3D = { x: 0, y: 0, z: 1 };

// A cube of side 1 centred on the origin: its volume is exactly 1, so the
// "Vol" label on the canvas reads the determinant directly.
export const UNIT_CUBE: LessonShape3D = { type: 'cube', vertices: cubePresetVertices(0.5) };

export const UNIT_SPHERE: LessonShape3D = { type: 'sphere', vertices: [[0, 0, 0]], radius: 1 };
