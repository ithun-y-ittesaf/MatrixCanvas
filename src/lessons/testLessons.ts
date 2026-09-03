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

export const TEST_LESSONS: Lesson[] = [TEST_LESSON_IDENTITY_SCALE, TEST_LESSON_REFLECT_SHAPE];
