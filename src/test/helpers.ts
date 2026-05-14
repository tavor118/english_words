import type { FsrsState, Word } from '../types';
import { emptyProgress } from '../utils/exercise-progress';

let idCounter = 0;

export function createFsrsState(overrides: Partial<FsrsState> = {}): FsrsState {
  return {
    due: 0,
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    learningSteps: 0,
    state: 0,
    lastReview: null,
    ...overrides,
  };
}

export function createWord(overrides: Partial<Word> = {}): Word {
  idCounter += 1;
  return {
    id: `test-${idCounter}`,
    word: `word${idCounter}`,
    translation: `translation${idCounter}`,
    example: '',
    tags: [],
    createdAt: Date.now() - idCounter * 1000,
    ratings: { again: 0, hard: 0, good: 0, easy: 0 },
    lastRating: null,
    fsrs: createFsrsState(),
    favorite: false,
    imageUrl: null,
    audioUrl: null,
    progress: emptyProgress(),
    learnedAt: null,
    ...overrides,
  };
}
