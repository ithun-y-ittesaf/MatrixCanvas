import type { Lesson } from './types';
import { BEGINNER_TRACK } from './beginnerTrack';

// The single place lesson-consuming UI (LearningPage) reads the full
// curriculum from, so a new track just needs to be added to this array —
// nothing else has to change to make it navigable. Intermediate and
// Decompositions tracks have no real content yet; TEST_LESSONS in
// testLessons.ts stays out of here since those are dev-only smoke-test
// lessons for the engine (see appStore.lessons.test.ts), not curriculum.
export const ALL_LESSONS: Lesson[] = [...BEGINNER_TRACK];
