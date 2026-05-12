import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DAILY_GOAL,
  loadDailyProgress,
  saveDailyProgress,
  todayKey,
} from '../utils/daily-progress';

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

describe('daily-progress', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it('returns 0 points for today when nothing is stored', () => {
    const p = loadDailyProgress();
    expect(p.points).toBe(0);
    expect(p.date).toBe(todayKey());
  });

  it('round-trips today\'s points through save/load', () => {
    saveDailyProgress({ date: todayKey(), points: 12 });
    expect(loadDailyProgress().points).toBe(12);
  });

  it('resets to 0 on a new day when the stored date is stale', () => {
    saveDailyProgress({ date: '2000-01-01', points: 42 });
    const p = loadDailyProgress();
    expect(p.points).toBe(0);
    expect(p.date).toBe(todayKey());
  });

  it('caps the goal at 50 by default', () => {
    expect(DAILY_GOAL).toBe(50);
  });
});
