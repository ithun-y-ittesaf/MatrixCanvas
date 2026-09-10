import type { Lesson } from './types';

// Hand-written smoke-test lessons. These exist only to prove the lesson
// engine plumbing (the store's lesson slice + applyLessonStep) actually
// drives the Playground's existing matrix/vector/shape state end-to-end —
// see appStore.lessons.test.ts. Not real lesson content; the curriculum
// itself (LearningPage's Beginner/Intermediate/.../Decompositions topics)
// is a separate, later pass.

export const TEST_LESSON_IDENTITY_SCALE: Lesson = {
  id: 'test-identity-scale',
  track: 'beginner',
  title: '[Test] Identity to Scale',
  steps: [
    {
      id: 'step-identity',
      title: 'Identity matrix',
      explanation: 'The identity matrix leaves every vector exactly where it started.',
      matrix: [[1, 0], [0, 1]],
      vectors: [{ x: 1, y: 0 }],
      katex: '\\begin{bmatrix}1 & 0\\\\0 & 1\\end{bmatrix}',
    },
    {
      id: 'step-scale',
      title: 'Scale by 2',
      explanation: 'Scaling both axes by 2 doubles the length of every vector.',
      matrix: [[2, 0], [0, 2]],
      vectors: [{ x: 1, y: 0 }],
      katex: '\\begin{bmatrix}2 & 0\\\\0 & 2\\end{bmatrix}',
    },
  ],
};

export const TEST_LESSON_REFLECT_SHAPE: Lesson = {
  id: 'test-reflect-shape',
  track: 'intermediate',
  title: '[Test] Rectangle Reflection',
  steps: [
    {
      id: 'step-original',
      title: 'A rectangle, untransformed',
      explanation: 'Starting shape before any reflection is applied.',
      matrix: [[1, 0], [0, 1]],
      shapes: [{ type: 'rectangle', vertices: [[-1, -1], [1, -1], [1, 1], [-1, 1]] }],
    },
    {
      id: 'step-reflected',
      title: 'Reflect over the X axis',
      explanation: 'Flipping the sign of the y-scale mirrors the rectangle over the X axis.',
      matrix: [[1, 0], [0, -1]],
      shapes: [{ type: 'rectangle', vertices: [[-1, -1], [1, -1], [1, 1], [-1, 1]] }],
      katex: '\\begin{bmatrix}1 & 0\\\\0 & -1\\end{bmatrix}',
    },
  ],
};

// Exercises the `decomposition` field (see LessonStep in types.ts): this
// step's canvas is driven by DecompositionPlayer stepping through the
// matrix's SVD, not a single static application of it like the two lessons
// above. See decompositionLessonSteps.test.ts for the guard that every
// decomposition-flagged step (here and in the real curriculum) actually
// builds a sequence.
export const TEST_LESSON_DECOMPOSITION_SVD: Lesson = {
  id: 'test-decomposition-svd',
  track: 'decompositions',
  title: '[Test] SVD of a Shear',
  steps: [
    {
      id: 'step-svd-shear',
      title: 'SVD: rotate, scale, rotate',
      explanation: 'Any matrix decomposes into a rotation, an axis-aligned scale, and another rotation.',
      matrix: [[2, 1], [1, 1]],
      decomposition: 'svd',
    },
  ],
};

export const TEST_LESSONS: Lesson[] = [
  TEST_LESSON_IDENTITY_SCALE,
  TEST_LESSON_REFLECT_SHAPE,
  TEST_LESSON_DECOMPOSITION_SVD,
];
