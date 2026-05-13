import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useState, useCallback } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import type { Word } from '../types';
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

vi.mock('../utils/drive-sync', () => ({
  isConfigured: vi.fn(() => true),
  isSignedIn: vi.fn(() => true),
  signIn: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(),
  downloadWords: vi.fn(),
  uploadWords: vi.fn(() => Promise.resolve('2026-05-13T00:00:00Z')),
}));

import * as driveSync from '../utils/drive-sync';
import { useDriveSync } from '../hooks/useDriveSync';

const SIGNED_IN_KEY = 'english-words-drive-signed-in';

function useDriveSyncWithWords(initial: Word[]) {
  const [words, setWords] = useState<Word[]>(initial);
  const replaceWords = useCallback((next: Word[]) => setWords(next), []);
  const sync = useDriveSync({ words, replaceWords });
  return { words, sync };
}

afterEach(() => {
  cleanup();
  Object.keys(store).forEach((k) => delete store[k]);
  vi.clearAllMocks();
});

describe('useDriveSync auto-sign-in', () => {
  beforeEach(() => {
    store[SIGNED_IN_KEY] = '1';
  });

  it('downloads remote words exactly once on mount even though replaceWords updates state', async () => {
    // Use an identical entry on both sides so merge produces no diff and there's no push-back upload.
    const shared = createWord({ id: 'shared', word: 'shared' });
    vi.mocked(driveSync.downloadWords).mockResolvedValue({
      words: [shared],
      modifiedTime: '2026-05-13T00:00:00Z',
    });

    const { result } = renderHook(() => useDriveSyncWithWords([shared]));

    // let the awaited downloadWords + replaceWords + any follow-up effects settle
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(driveSync.downloadWords).toHaveBeenCalledTimes(1);
    expect(driveSync.uploadWords).not.toHaveBeenCalled();
    expect(result.current.words.map((w) => w.id)).toEqual(['shared']);
    expect(result.current.sync.status).toBe('idle');
  });

  it('merges local + remote on initial sync and pushes the merged result back', async () => {
    const remote: Word[] = [createWord({ id: 'remote-only', word: 'remote' })];
    vi.mocked(driveSync.downloadWords).mockResolvedValue({
      words: remote,
      modifiedTime: '2026-05-13T00:00:00Z',
    });

    const local: Word[] = [createWord({ id: 'local-only', word: 'local' })];
    const { result } = renderHook(() => useDriveSyncWithWords(local));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(driveSync.downloadWords).toHaveBeenCalledTimes(1);
    // remote has only 'remote-only', local has only 'local-only' → merged differs from remote → push back
    expect(driveSync.uploadWords).toHaveBeenCalledTimes(1);
    const uploaded = vi.mocked(driveSync.uploadWords).mock.calls[0][0];
    expect(uploaded.map((w: Word) => w.id).sort()).toEqual(['local-only', 'remote-only']);
    expect(result.current.words.map((w) => w.id).sort()).toEqual(['local-only', 'remote-only']);
    expect(result.current.sync.status).toBe('idle');
  });

  it('skips upload when remote already equals merged result', async () => {
    const same = createWord({ id: 'same', word: 'same' });
    vi.mocked(driveSync.downloadWords).mockResolvedValue({
      words: [same],
      modifiedTime: '2026-05-13T00:00:00Z',
    });

    const { result } = renderHook(() => useDriveSyncWithWords([same]));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(driveSync.downloadWords).toHaveBeenCalledTimes(1);
    expect(driveSync.uploadWords).not.toHaveBeenCalled();
    expect(result.current.sync.status).toBe('idle');
  });

  it('uploads exactly once when remote file is missing', async () => {
    vi.mocked(driveSync.downloadWords).mockResolvedValue(null);

    const local: Word[] = [createWord({ id: 'local-1', word: 'local' })];
    const { result } = renderHook(() => useDriveSyncWithWords(local));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(driveSync.downloadWords).toHaveBeenCalledTimes(1);
    expect(driveSync.uploadWords).toHaveBeenCalledTimes(1);
    expect(result.current.sync.status).toBe('idle');
  });
});
