import { describe, it, expect } from 'vitest';
import { ALL_LESSONS } from './index';
import { TEST_LESSONS } from './testLessons';
import { buildDecompositionSequence } from '../math/decompositionSequences';

// Guards the LessonStep.decomposition <-> DecompositionPlayer wiring: any
// step that opts into a decomposition animation must actually produce one.
// Catches an authoring mistake early (e.g. `decomposition: 'eigen'` on a
// rotation matrix) rather than leaving LessonRunner to show its "no real
// decomposition" fallback at runtime. Runs over the real curriculum as well
// as the dev-only TEST_LESSONS, so it keeps working once decomposition-track
// content actually lands in lessons/index.ts.
describe('decomposition-flagged lesson steps', () => {
  const allSteps = [...ALL_LESSONS, ...TEST_LESSONS].flatMap((lesson) =>
    lesson.steps.map((step) => ({ lessonId: lesson.id, step })),
  );
  const decompositionSteps = allSteps.filter(({ step }) => step.decomposition);

  it('has at least one decomposition-flagged step to check (sanity check for this test itself)', () => {
    expect(decompositionSteps.length).toBeGreaterThan(0);
  });

  for (const { lessonId, step } of decompositionSteps) {
    it(`${lessonId}/${step.id}: ${step.decomposition} builds a sequence for its matrix`, () => {
      const sequence = buildDecompositionSequence(step.decomposition!, step.matrix);
      expect(sequence).not.toBeNull();
      expect(sequence!.steps.length).toBeGreaterThan(0);
    });
  }
});
