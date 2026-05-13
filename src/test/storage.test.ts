import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadWords, saveWords } from '../utils/storage';
import { allPassedProgress, emptyProgress } from '../utils/exercise-progress';
import { EXERCISE_KEYS } from '../types';
import { createWord } from './helpers';

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('storage', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it('returns empty array when no data stored', () => {
    expect(loadWords()).toEqual([]);
  });

  it('round-trips words through save/load', () => {
    const words = [createWord({ word: 'hello' }), createWord({ word: 'world' })];
    saveWords(words);
    const loaded = loadWords();
    expect(loaded).toEqual(words);
  });

  it('migrates words missing progress field to an empty progress map', () => {
    // Simulate the v1 schema: no progress, no learnedAt.
    const v1Word = { ...createWord({ word: 'old' }) } as Partial<ReturnType<typeof createWord>>;
    delete v1Word.progress;
    delete v1Word.learnedAt;
    store['english-words'] = JSON.stringify([v1Word]);

    const loaded = loadWords();
    expect(loaded[0].progress).toEqual(emptyProgress());
    expect(loaded[0].learnedAt).toBeNull();
  });

  it('preserves partial progress and stamps learnedAt when all six are already true', () => {
    const v1Word = {
      ...createWord({ word: 'old' }),
      progress: allPassedProgress(),
      learnedAt: undefined as unknown,
    };
    store['english-words'] = JSON.stringify([v1Word]);

    const loaded = loadWords();
    expect(EXERCISE_KEYS.every((k) => loaded[0].progress[k])).toBe(true);
    expect(loaded[0].learnedAt).toBeGreaterThan(0);
  });

  it('fills in defaults for words missing optional fields', () => {
    store['english-words'] = JSON.stringify([
      { id: 'a', word: 'apple', translation: 'яблуко' },
    ]);

    const loaded = loadWords();
    expect(loaded[0]).toMatchObject({
      id: 'a',
      word: 'apple',
      translation: 'яблуко',
      example: '',
      tags: [],
      correctCount: 0,
      incorrectCount: 0,
      lastReviewedAt: null,
      interval: 1,
      favorite: false,
      imageUrl: null,
      audioUrl: null,
    });
    expect(loaded[0].progress).toEqual(emptyProgress());
    expect(loaded[0].createdAt).toBeGreaterThan(0);
  });
});
