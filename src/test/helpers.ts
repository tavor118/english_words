import type { Word } from '../types';

let idCounter = 0;

export function createWord(overrides: Partial<Word> = {}): Word {
  idCounter += 1;
  return {
    id: `test-${idCounter}`,
    word: `word${idCounter}`,
    translation: `translation${idCounter}`,
    example: '',
    tags: [],
    createdAt: Date.now() - idCounter * 1000,
    correctCount: 0,
    incorrectCount: 0,
    lastReviewedAt: null,
    nextReviewAt: 0,
    interval: 1,
    favorite: false,
    imageUrl: null,
    audioUrl: null,
    ...overrides,
  };
}
