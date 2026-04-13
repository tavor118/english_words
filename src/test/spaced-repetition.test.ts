import { describe, it, expect } from 'vitest';
import { updateWordAfterReview, getWordsForReview, shuffle } from '../utils/spaced-repetition';
import { createWord } from './helpers';

describe('updateWordAfterReview', () => {
  it('increases correctCount and interval on correct answer', () => {
    const word = createWord({ correctCount: 0, interval: 1 });
    const result = updateWordAfterReview(word, true);
    expect(result.correctCount).toBe(1);
    expect(result.interval).toBe(2.5);
    expect(result.lastReviewedAt).toBeGreaterThan(0);
    expect(result.nextReviewAt).toBeGreaterThan(Date.now());
  });

  it('resets interval to 1 on incorrect answer', () => {
    const word = createWord({ incorrectCount: 0, interval: 10 });
    const result = updateWordAfterReview(word, false);
    expect(result.incorrectCount).toBe(1);
    expect(result.interval).toBe(1);
  });

  it('caps interval at 365 days', () => {
    const word = createWord({ interval: 200 });
    const result = updateWordAfterReview(word, true);
    expect(result.interval).toBe(365);
  });
});

describe('getWordsForReview', () => {
  it('returns words whose nextReviewAt is in the past', () => {
    const due = createWord({ nextReviewAt: Date.now() - 1000 });
    const notDue = createWord({ nextReviewAt: Date.now() + 100000 });
    const result = getWordsForReview([due, notDue]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(due.id);
  });

  it('returns empty array when no words are due', () => {
    const word = createWord({ nextReviewAt: Date.now() + 100000 });
    expect(getWordsForReview([word])).toHaveLength(0);
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
