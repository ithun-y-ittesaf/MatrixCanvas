import type { Lesson3D } from '../lessons/types';
import { BEGINNER_TRACK_3D } from './beginnerTrack3d';
import { INTERMEDIATE_TRACK_3D } from './intermediateTrack3d';
import { DECOMPOSITIONS_TRACK_3D } from './decompositionsTrack3d';

// The 3D curriculum: the same three tracks and 17 lessons as ALL_LESSONS in
// ../lessons, with 3D-native content where the third dimension adds something
// (subspaces as lines and planes, determinant as volume, SVD as
// sphere -> ellipsoid, rotation about an axis).
export const ALL_LESSONS_3D: Lesson3D[] = [
  ...BEGINNER_TRACK_3D,
  ...INTERMEDIATE_TRACK_3D,
  ...DECOMPOSITIONS_TRACK_3D,
];
