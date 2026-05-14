import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadWords, mergeWordLists, saveWords } from '../utils/storage';
import { allPassedProgress, emptyProgress } from '../utils/exercise-progress';
import { EXERCISE_KEYS } from '../types';
import { createFsrsState, createWord } from './helpers';

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
      ratings: { again: 0, hard: 0, good: 0, easy: 0 },
      favorite: false,
      imageUrl: null,
      audioUrl: null,
    });
    expect(loaded[0].progress).toEqual(emptyProgress());
    expect(loaded[0].createdAt).toBeGreaterThan(0);
    expect(loaded[0].fsrs.state).toBe(0);
    expect(loaded[0].fsrs.reps).toBe(0);
  });

  it('drops legacy SM-2 fields and initializes fresh FSRS state on load', () => {
    store['english-words'] = JSON.stringify([
      {
        id: 'legacy',
        word: 'old',
        translation: 'старий',
        interval: 30,
        lastReviewedAt: 1000,
        nextReviewAt: 9999999,
      },
    ]);

    const loaded = loadWords();
    expect(loaded[0]).not.toHaveProperty('interval');
    expect(loaded[0]).not.toHaveProperty('nextReviewAt');
    expect(loaded[0]).not.toHaveProperty('lastReviewedAt');
    expect(loaded[0].fsrs.state).toBe(0);
    expect(loaded[0].fsrs.reps).toBe(0);
  });
});

describe('mergeWordLists', () => {
  it('keeps local-only and remote-only words', () => {
    const localOnly = createWord({ id: 'L', word: 'local' });
    const remoteOnly = createWord({ id: 'R', word: 'remote' });
    const merged = mergeWordLists([localOnly], [remoteOnly]);
    expect(merged.map((w) => w.id).sort()).toEqual(['L', 'R']);
  });

  it('ORs per-exercise progress on shared ids', () => {
    const local = createWord({
      id: 'shared',
      progress: { ...emptyProgress(), quiz: true, typing: true },
    });
    const remote = createWord({
      id: 'shared',
      progress: { ...emptyProgress(), listening: true, scrambled: true },
    });
    const [merged] = mergeWordLists([local], [remote]);
    expect(merged.progress).toEqual({
      ...emptyProgress(),
      quiz: true,
      typing: true,
      listening: true,
      scrambled: true,
    });
  });

  it('takes max per-rating count and pairs fsrs + lastRating from whichever side reviewed most recently', () => {
    const local = createWord({
      id: 'shared',
      ratings: { again: 2, hard: 1, good: 5, easy: 0 },
      lastRating: 3,
      fsrs: createFsrsState({ lastReview: 1000, stability: 4, due: 9000, state: 2 }),
    });
    const remote = createWord({
      id: 'shared',
      ratings: { again: 6, hard: 3, good: 3, easy: 1 },
      lastRating: 1,
      fsrs: createFsrsState({ lastReview: 2000, stability: 2, due: 12000, state: 2 }),
    });
    const [merged] = mergeWordLists([local], [remote]);
    expect(merged.ratings).toEqual({ again: 6, hard: 3, good: 5, easy: 1 });
    expect(merged.fsrs.lastReview).toBe(2000);
    expect(merged.fsrs.stability).toBe(2);
    expect(merged.fsrs.due).toBe(12000);
    // Remote reviewed more recently, so its lastRating wins along with its FSRS block.
    expect(merged.lastRating).toBe(1);
  });

  it('keeps earliest learnedAt and unions favorite/tags', () => {
    const local = createWord({
      id: 'shared',
      learnedAt: 5000,
      favorite: true,
      tags: ['a', 'b'],
    });
    const remote = createWord({
      id: 'shared',
      learnedAt: 3000,
      favorite: false,
      tags: ['b', 'c'],
    });
    const [merged] = mergeWordLists([local], [remote]);
    expect(merged.learnedAt).toBe(3000);
    expect(merged.favorite).toBe(true);
    expect(merged.tags.sort()).toEqual(['a', 'b', 'c']);
  });

  it('preserves local order and appends remote-only at the end', () => {
    const l1 = createWord({ id: 'L1' });
    const l2 = createWord({ id: 'L2' });
    const r1 = createWord({ id: 'R1' });
    const merged = mergeWordLists([l1, l2], [r1]);
    expect(merged.map((w) => w.id)).toEqual(['L1', 'L2', 'R1']);
  });
});
