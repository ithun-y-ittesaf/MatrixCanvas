import type { Matrix2x2Values } from '../math/Matrix2x2';
import { PRESETS } from '../utils/presets';

// Looks a transform up by its MatrixInput dropdown label, so lesson content
// that uses a "named" preset (rotation/shear/reflection/scale/...) stays in
// sync with PRESETS instead of re-typing the same numbers. Shared across
// track files (beginnerTrack.ts, intermediateTrack.ts, ...) rather than each
// redefining its own copy.
export function presetValues(label: string): Matrix2x2Values {
  const preset = PRESETS.find((p) => p.label === label);
  if (!preset) throw new Error(`lessons: no preset labeled "${label}"`);
  return preset.values;
}

export const IDENTITY: Matrix2x2Values = presetValues('Identity');
