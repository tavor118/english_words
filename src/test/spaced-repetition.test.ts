import { describe, it, expect } from 'vitest';
import {
  createInitialFsrsState,
  getWordsForReview,
  RATING_AGAIN,
  RATING_EASY,
  RATING_GOOD,
  RATING_HARD,
  scheduleReview,
  shuffle,
} from '../utils/spaced-repetition';
import { createFsrsState, createWord } from './helpers';

describe('createInitialFsrsState', () => {
  it('returns a fresh New-state card due now', () => {
    const before = Date.now();
    const state = createInitialFsrsState();
    expect(state.state).toBe(0);
    expect(state.reps).toBe(0);
    expect(state.lapses).toBe(0);
    expect(state.due).toBeGreaterThanOrEqual(before);
    expect(state.lastReview).toBeNull();
  });
});

describe('scheduleReview', () => {
  it('records a review and increments reps for Good on a new card', () => {
    const state = createInitialFsrsState();
    const next = scheduleReview(state, RATING_GOOD);
    expect(next.reps).toBe(1);
    expect(next.lapses).toBe(0);
    expect(next.lastReview).not.toBeNull();
    expect(next.stability).toBeGreaterThan(0);
  });

  it('counts a lapse when rating Again on a Review-state card', () => {
    const state = createFsrsState({ state: 2, stability: 10, difficulty: 5, reps: 3 });
    const next = scheduleReview(state, RATING_AGAIN);
    expect(next.lapses).toBe(1);
  });

  it('schedules Easy further out than Good for the same input', () => {
    const state = createInitialFsrsState();
    const good = scheduleReview(state, RATING_GOOD);
    const easy = scheduleReview(state, RATING_EASY);
    expect(easy.due).toBeGreaterThan(good.due);
  });

  it('schedules Hard sooner than Good for the same input', () => {
    const state = createFsrsState({ state: 2, stability: 5, difficulty: 5, reps: 3, lastReview: Date.now() - 86400000 });
    const good = scheduleReview(state, RATING_GOOD);
    const hard = scheduleReview(state, RATING_HARD);
    expect(hard.due).toBeLessThan(good.due);
  });
});

describe('getWordsForReview', () => {
  it('returns words whose fsrs.due is in the past', () => {
    const due = createWord({ fsrs: createFsrsState({ due: Date.now() - 1000 }) });
    const notDue = createWord({ fsrs: createFsrsState({ due: Date.now() + 100000 }) });
    const result = getWordsForReview([due, notDue]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(due.id);
  });

  it('returns empty array when no words are due', () => {
    const word = createWord({ fsrs: createFsrsState({ due: Date.now() + 100000 }) });
    expect(getWordsForReview([word])).toHaveLength(0);
  });

  it('sorts by due ascending', () => {
    const a = createWord({ fsrs: createFsrsState({ due: Date.now() - 500 }) });
    const b = createWord({ fsrs: createFsrsState({ due: Date.now() - 2000 }) });
    const result = getWordsForReview([a, b]);
    expect(result.map((w) => w.id)).toEqual([b.id, a.id]);
  });
});

describe('shuffle', () => {
  it('returns array of same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect(result.sort()).toEqual(input.sort());
  });

  it('does not mutate original array', () => {
    const input = [1, 2, 3];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});
