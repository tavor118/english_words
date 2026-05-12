import type { Word, ExerciseKey, ExerciseProgress } from '../types';
import { EXERCISE_KEYS } from '../types';

export function emptyProgress(): ExerciseProgress {
  return EXERCISE_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as ExerciseProgress);
}

export function allPassedProgress(): ExerciseProgress {
  return EXERCISE_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as ExerciseProgress);
}

export function isLearned(word: Word): boolean {
  return EXERCISE_KEYS.every((key) => word.progress[key]);
}

export function countPassed(word: Word): number {
  return EXERCISE_KEYS.reduce((n, key) => n + (word.progress[key] ? 1 : 0), 0);
}

export function markExercisePassed(word: Word, key: ExerciseKey): Partial<Word> {
  if (word.progress[key]) return {};
  const progress: ExerciseProgress = { ...word.progress, [key]: true };
  const learned = EXERCISE_KEYS.every((k) => progress[k]);
  return {
    progress,
    learnedAt: learned ? Date.now() : word.learnedAt,
  };
}

export function resetProgress(): Partial<Word> {
  return {
    progress: emptyProgress(),
    learnedAt: null,
  };
}

export function markAllLearned(): Partial<Word> {
  return {
    progress: allPassedProgress(),
    learnedAt: Date.now(),
  };
}

export function getWordsForExercise(words: Word[], key: ExerciseKey): Word[] {
  return words.filter((w) => !w.progress[key]);
}
