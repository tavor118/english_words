import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadWords, saveWords } from '../utils/storage';
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
});
