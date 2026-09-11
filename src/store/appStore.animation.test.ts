import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './appStore';
import type { Matrix2x2Values } from '../math/Matrix2x2';

// Covers animFrom / triggerAnimationFrom — the extension DecompositionPlayer
// (src/components/DecompositionPlayer.tsx) uses to tween stop-to-stop instead
// of always starting from identity, and confirms triggerAnimation (the plain
// "Animate" button) still always resets to identity even if something left
// animFrom pointed elsewhere.

const IDENTITY: Matrix2x2Values = [[1, 0], [0, 1]];

function resetStore() {
  useAppStore.setState({
    matrixValues: [[1, 0], [0, 1]],
    animFrom: [[1, 0], [0, 1]],
    animProgress: 1,
    animTrigger: 0,
    isScrubbing: true, // deliberately "dirty" so we can assert it gets cleared
  });
}

describe('appStore animation slice', () => {
  beforeEach(resetStore);

  it('defaults animFrom to identity', () => {
    expect(useAppStore.getState().animFrom).toEqual(IDENTITY);
  });

  it('triggerAnimationFrom points animFrom/matrixValues at the given pair and restarts the tween', () => {
    const from: Matrix2x2Values = [[2, 0], [0, 2]];
    const to: Matrix2x2Values = [[0, -1], [1, 0]];

    useAppStore.getState().triggerAnimationFrom(from, to);
    const state = useAppStore.getState();

    expect(state.animFrom).toEqual(from);
    expect(state.matrixValues).toEqual(to);
    expect(state.animProgress).toBe(0);
    expect(state.animTrigger).toBe(1);
    expect(state.isScrubbing).toBe(false);
  });

  it('chains multiple triggerAnimationFrom calls, each bumping animTrigger', () => {
    const store = useAppStore.getState();
    store.triggerAnimationFrom([[1, 0], [0, 1]], [[2, 0], [0, 1]]);
    store.triggerAnimationFrom([[2, 0], [0, 1]], [[2, 1], [0, 1]]);

    const state = useAppStore.getState();
    expect(state.animFrom).toEqual([[2, 0], [0, 1]]);
    expect(state.matrixValues).toEqual([[2, 1], [0, 1]]);
    expect(state.animTrigger).toBe(2);
  });

  it('triggerAnimation resets animFrom to identity even if it was pointed elsewhere', () => {
    useAppStore.setState({ animFrom: [[5, 5], [5, 5]] });
    useAppStore.getState().triggerAnimation();

    const state = useAppStore.getState();
    expect(state.animFrom).toEqual(IDENTITY);
    expect(state.animProgress).toBe(0);
    expect(state.isScrubbing).toBe(false);
  });

  it('exitLesson resets animFrom to identity', () => {
    useAppStore.setState({ animFrom: [[3, 0], [0, 3]], activeLesson: null });
    useAppStore.getState().exitLesson();

    expect(useAppStore.getState().animFrom).toEqual(IDENTITY);
  });
});
