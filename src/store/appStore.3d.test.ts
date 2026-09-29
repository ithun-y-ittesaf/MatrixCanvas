import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, cubePresetVertices, pyramidPresetVertices } from './appStore';
import type { Lesson3D } from '../lessons/types';
import type { Matrix3x3Values } from '../math/Matrix3x3';
import { TEST_LESSON_IDENTITY_SCALE } from '../lessons/testLessons';

const I3: Matrix3x3Values = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const LESSON_3D: Lesson3D = {
  id: 'test-3d',
  track: 'beginner',
  title: 'Test 3D',
  dimension: '3d',
  steps: [
    {
      id: 's1',
      title: 'Scale',
      explanation: '',
      matrix: [[2, 0, 0], [0, 2, 0], [0, 0, 2]],
      vectors: [{ x: 1, y: 2, z: 3 }],
      shapes: [{ type: 'cube', vertices: cubePresetVertices() }],
      overlays: ['unitSphere'],
    },
    { id: 's2', title: 'Identity', explanation: '', matrix: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  ],
};

function resetStore() {
  useAppStore.setState({
    mode: '2d',
    matrixValues: [[1, 0], [0, 1]],
    matrixValues3d: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    animFrom3d: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    customVectors: [],
    shapes: [],
    customVectors3d: [],
    shapes3d: [],
    overlays3d: [],
    activeLesson: null,
    activeStepIndex: 0,
    nextSeq: 0,
  });
}

describe('3D store slice', () => {
  beforeEach(resetStore);

  it('adds, updates, and removes 3D vectors', () => {
    const s = useAppStore.getState();
    s.addVector3d(1, 2, 3);
    const [v] = useAppStore.getState().customVectors3d;
    expect(v).toMatchObject({ x: 1, y: 2, z: 3 });
    useAppStore.getState().updateVector3d(v.id, 4, 5, 6);
    expect(useAppStore.getState().customVectors3d[0]).toMatchObject({ x: 4, y: 5, z: 6 });
    useAppStore.getState().removeVector3d(v.id);
    expect(useAppStore.getState().customVectors3d).toHaveLength(0);
  });

  it('shares one color/seq cycle between vectors and shapes', () => {
    const s = useAppStore.getState();
    s.addVector3d(1, 0, 0);
    s.addShape3d('cube', cubePresetVertices());
    const st = useAppStore.getState();
    expect(st.customVectors3d[0].seq).toBe(0);
    expect(st.shapes3d[0].seq).toBe(1);
    expect(st.customVectors3d[0].color).not.toBe(st.shapes3d[0].color);
  });

  it('stores sphere radius and rewrites shape vertices', () => {
    useAppStore.getState().addShape3d('sphere', [[0, 0, 0]], 1.5);
    const sphere = useAppStore.getState().shapes3d[0];
    expect(sphere.radius).toBe(1.5);
    useAppStore.getState().setShapeVertices3d(sphere.id, [[1, 1, 1]]);
    expect(useAppStore.getState().shapes3d[0].vertices).toEqual([[1, 1, 1]]);
  });

  it('toggles overlays', () => {
    useAppStore.getState().toggleOverlay3d('eigenvectors');
    expect(useAppStore.getState().overlays3d).toEqual(['eigenvectors']);
    useAppStore.getState().toggleOverlay3d('eigenvectors');
    expect(useAppStore.getState().overlays3d).toEqual([]);
  });

  it('preset geometry has the vertex counts the canvas expects', () => {
    expect(cubePresetVertices()).toHaveLength(8);
    expect(pyramidPresetVertices()).toHaveLength(5);
  });

  it('triggerAnimationFrom3d tweens between two matrices and restarts progress', () => {
    const to: Matrix3x3Values = [[2, 0, 0], [0, 2, 0], [0, 0, 2]];
    const before = useAppStore.getState().animTrigger;
    useAppStore.getState().triggerAnimationFrom3d(I3, to);
    const st = useAppStore.getState();
    expect(st.matrixValues3d).toEqual(to);
    expect(st.animProgress).toBe(0);
    expect(st.animTrigger).toBe(before + 1);
  });

  it('triggerAnimation resets both animFrom matrices to identity', () => {
    useAppStore.setState({
      animFrom: [[3, 0], [0, 3]],
      animFrom3d: [[3, 0, 0], [0, 3, 0], [0, 0, 3]],
    });
    useAppStore.getState().triggerAnimation();
    const st = useAppStore.getState();
    expect(st.animFrom).toEqual([[1, 0], [0, 1]]);
    expect(st.animFrom3d).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  });
});

describe('3D lessons', () => {
  beforeEach(resetStore);

  it('startLesson switches to 3d mode and applies the first step to the 3D state', () => {
    useAppStore.getState().startLesson(LESSON_3D);
    const st = useAppStore.getState();
    expect(st.mode).toBe('3d');
    expect(st.matrixValues3d).toEqual([[2, 0, 0], [0, 2, 0], [0, 0, 2]]);
    expect(st.customVectors3d).toHaveLength(1);
    expect(st.shapes3d).toHaveLength(1);
    expect(st.overlays3d).toEqual(['unitSphere']);
    // 2D state is untouched.
    expect(st.matrixValues).toEqual([[1, 0], [0, 1]]);
  });

  it('nextStep replaces vectors, shapes and overlays', () => {
    useAppStore.getState().startLesson(LESSON_3D);
    useAppStore.getState().nextStep();
    const st = useAppStore.getState();
    expect(st.activeStepIndex).toBe(1);
    expect(st.matrixValues3d).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(st.customVectors3d).toHaveLength(0);
    expect(st.shapes3d).toHaveLength(0);
    expect(st.overlays3d).toEqual([]);
  });

  it('exitLesson resets only the 3D side of a 3D lesson', () => {
    useAppStore.setState({ matrixValues: [[5, 0], [0, 5]] });
    useAppStore.getState().startLesson(LESSON_3D);
    useAppStore.getState().exitLesson();
    const st = useAppStore.getState();
    expect(st.activeLesson).toBeNull();
    expect(st.matrixValues3d).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
    expect(st.customVectors3d).toHaveLength(0);
    expect(st.matrixValues).toEqual([[5, 0], [0, 5]]);
  });

  it('exitLesson of a 2D lesson leaves the 3D playground alone', () => {
    useAppStore.setState({ matrixValues3d: [[2, 0, 0], [0, 2, 0], [0, 0, 2]] });
    useAppStore.getState().startLesson(TEST_LESSON_IDENTITY_SCALE);
    expect(useAppStore.getState().mode).toBe('2d');
    useAppStore.getState().exitLesson();
    expect(useAppStore.getState().matrixValues3d).toEqual([[2, 0, 0], [0, 2, 0], [0, 0, 2]]);
  });
});
