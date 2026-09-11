import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';
import { TEST_LESSON_IDENTITY_SCALE, TEST_LESSON_REFLECT_SHAPE } from '../lessons/testLessons';

// Proves the lesson engine plumbing end-to-end: driving it through
// startLesson/nextStep/prevStep/exitLesson lands on the exact same
// matrixValues/customVectors/shapes fields that the Playground page's
// TransformCanvas/CanvasToolbar/ExpressionSidebar already read, so a
// lesson step really does "programmatically control the canvas state"
// (FR-7) with zero lesson-specific UI needed to prove it.

function resetStore() {
  useAppStore.setState({
    matrixValues: [[1, 0], [0, 1]],
    customVectors: [],
    shapes: [],
    activeLesson: null,
    activeStepIndex: 0,
  });
}

describe('lesson engine plumbing', () => {
  beforeEach(resetStore);

  it('startLesson applies the first step onto the shared canvas state', () => {
    useAppStore.getState().startLesson(TEST_LESSON_IDENTITY_SCALE);
    const state = useAppStore.getState();

    expect(state.activeLesson?.id).toBe(TEST_LESSON_IDENTITY_SCALE.id);
    expect(state.activeStepIndex).toBe(0);
    expect(state.matrixValues).toEqual([[1, 0], [0, 1]]);
    expect(state.customVectors).toHaveLength(1);
    expect(state.customVectors[0]).toMatchObject({ x: 1, y: 0 });
  });

  it('nextStep advances and re-applies the following step', () => {
    useAppStore.getState().startLesson(TEST_LESSON_IDENTITY_SCALE);
    useAppStore.getState().nextStep();
    const state = useAppStore.getState();

    expect(state.activeStepIndex).toBe(1);
    expect(state.matrixValues).toEqual([[2, 0], [0, 2]]);
    // Replaced, not accumulated onto the previous step's vector.
    expect(state.customVectors).toHaveLength(1);
  });

  it('nextStep is a no-op past the last step', () => {
    useAppStore.getState().startLesson(TEST_LESSON_IDENTITY_SCALE);
    useAppStore.getState().nextStep();
    useAppStore.getState().nextStep();

    expect(useAppStore.getState().activeStepIndex).toBe(1);
  });

  it('prevStep steps back and re-applies the earlier step', () => {
    useAppStore.getState().startLesson(TEST_LESSON_IDENTITY_SCALE);
    useAppStore.getState().nextStep();
    useAppStore.getState().prevStep();
    const state = useAppStore.getState();

    expect(state.activeStepIndex).toBe(0);
    expect(state.matrixValues).toEqual([[1, 0], [0, 1]]);
  });

  it('prevStep is a no-op before the first step', () => {
    useAppStore.getState().startLesson(TEST_LESSON_IDENTITY_SCALE);
    useAppStore.getState().prevStep();

    expect(useAppStore.getState().activeStepIndex).toBe(0);
  });

  it('exitLesson clears the lesson slice and resets the canvas to blank', () => {
    useAppStore.getState().startLesson(TEST_LESSON_IDENTITY_SCALE);
    useAppStore.getState().nextStep(); // now sitting on the non-identity Scale-by-2 step
    useAppStore.getState().exitLesson();
    const state = useAppStore.getState();

    expect(state.activeLesson).toBeNull();
    expect(state.activeStepIndex).toBe(0);
    // Free-play mode shouldn't start out contaminated with whatever the
    // lesson's last active step had loaded.
    expect(state.matrixValues).toEqual([[1, 0], [0, 1]]);
    expect(state.customVectors).toEqual([]);
    expect(state.shapes).toEqual([]);
  });

  it('applies shapes for a shape-driving lesson, replacing shapes between steps', () => {
    useAppStore.getState().startLesson(TEST_LESSON_REFLECT_SHAPE);
    expect(useAppStore.getState().shapes).toHaveLength(1);

    useAppStore.getState().nextStep();
    const state = useAppStore.getState();

    expect(state.matrixValues).toEqual([[1, 0], [0, -1]]);
    expect(state.shapes).toHaveLength(1);
  });
});
