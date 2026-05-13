import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadWords, mergeWordLists, saveWords } from '../utils/storage';
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

  it('takes max of review counts and latest lastReviewedAt', () => {
    const local = createWord({
      id: 'shared',
      correctCount: 5,
      incorrectCount: 2,
      lastReviewedAt: 1000,
      interval: 4,
      nextReviewAt: 9000,
    });
    const remote = createWord({
      id: 'shared',
      correctCount: 3,
      incorrectCount: 6,
      lastReviewedAt: 2000,
      interval: 2,
      nextReviewAt: 12000,
    });
    const [merged] = mergeWordLists([local], [remote]);
    expect(merged.correctCount).toBe(5);
    expect(merged.incorrectCount).toBe(6);
    expect(merged.lastReviewedAt).toBe(2000);
    expect(merged.interval).toBe(4);
    expect(merged.nextReviewAt).toBe(12000);
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
