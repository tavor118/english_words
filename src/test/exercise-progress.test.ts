import { describe, it, expect } from 'vitest';
import {
  emptyProgress,
  allPassedProgress,
  isLearned,
  countPassed,
  markExercisePassed,
  resetProgress,
  markAllLearned,
  getWordsForExercise,
} from '../utils/exercise-progress';
import { EXERCISE_KEYS } from '../types';
import { createWord } from './helpers';

describe('emptyProgress', () => {
  it('has all six exercise keys set to false', () => {
    const p = emptyProgress();
    expect(Object.keys(p).sort()).toEqual([...EXERCISE_KEYS].sort());
    expect(Object.values(p).every((v) => v === false)).toBe(true);
  });
});

describe('isLearned', () => {
  it('returns false when any exercise is unpassed', () => {
    const word = createWord();
    expect(isLearned(word)).toBe(false);
  });

  it('returns true when all exercises are passed', () => {
    const word = createWord({ progress: allPassedProgress() });
    expect(isLearned(word)).toBe(true);
  });
});

describe('countPassed', () => {
  it('counts how many exercises have been passed', () => {
    const word = createWord({
      progress: { ...emptyProgress(), quiz: true, typing: true },
    });
    expect(countPassed(word)).toBe(2);
  });
});

describe('markExercisePassed', () => {
  it('flips a single exercise flag', () => {
    const word = createWord();
    const update = markExercisePassed(word, 'typing');
    expect(update.progress?.typing).toBe(true);
    expect(update.progress?.quiz).toBe(false);
  });

  it('does not set learnedAt unless all exercises pass', () => {
    const word = createWord();
    const update = markExercisePassed(word, 'typing');
    expect(update.learnedAt).toBeNull();
  });

  it('sets learnedAt when the final exercise is passed', () => {
    const allButOne = { ...allPassedProgress(), scrambled: false };
    const word = createWord({ progress: allButOne, learnedAt: null });
    const update = markExercisePassed(word, 'scrambled');
    expect(update.learnedAt).toBeGreaterThan(0);
    expect(Object.values(update.progress!).every(Boolean)).toBe(true);
  });

  it('is a no-op if already passed', () => {
    const word = createWord({ progress: { ...emptyProgress(), typing: true } });
    const update = markExercisePassed(word, 'typing');
    expect(update).toEqual({});
  });
});

describe('resetProgress', () => {
  it('clears all flags and learnedAt', () => {
    const update = resetProgress();
    expect(update.progress).toEqual(emptyProgress());
    expect(update.learnedAt).toBeNull();
  });
});

describe('markAllLearned', () => {
  it('flags all exercises and stamps learnedAt', () => {
    const update = markAllLearned();
    expect(Object.values(update.progress!).every(Boolean)).toBe(true);
    expect(update.learnedAt).toBeGreaterThan(0);
  });
});

describe('getWordsForExercise', () => {
  it('returns words where the given exercise is not yet passed', () => {
    const passed = createWord({ progress: { ...emptyProgress(), quiz: true } });
    const unpassed = createWord();
    const result = getWordsForExercise([passed, unpassed], 'quiz');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(unpassed.id);
  });
});
