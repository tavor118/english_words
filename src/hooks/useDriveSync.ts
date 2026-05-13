import { useCallback, useEffect, useRef, useState } from 'react';
import type { Word } from '../types';
import {
  downloadWords,
  isConfigured,
  isSignedIn,
  signIn as driveSignIn,
  signOut as driveSignOut,
  uploadWords,
} from '../utils/drive-sync';
import { migrateWords } from '../utils/storage';

export type SyncStatus = 'disabled' | 'signed-out' | 'syncing' | 'idle' | 'error';

const SIGNED_IN_KEY = 'english-words-drive-signed-in';
const LAST_MODIFIED_KEY = 'english-words-drive-modified';
const UPLOAD_DEBOUNCE_MS = 2000;

interface Args {
  words: Word[];
  replaceWords: (words: Word[]) => void;
}

export function useDriveSync({ words, replaceWords }: Args) {
  const configured = isConfigured();
  const [status, setStatus] = useState<SyncStatus>(configured ? 'signed-out' : 'disabled');
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const initialSyncDone = useRef(false);
  const uploadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUploadedJson = useRef<string | null>(null);

  const performInitialSync = useCallback(async () => {
    setStatus('syncing');
    setError(null);
    try {
      const remote = await downloadWords();
      if (remote) {
        const migrated = migrateWords(remote.words);
        replaceWords(migrated);
        localStorage.setItem(LAST_MODIFIED_KEY, remote.modifiedTime);
        lastUploadedJson.current = JSON.stringify(migrated);
      } else {
        const modifiedTime = await uploadWords(words);
        localStorage.setItem(LAST_MODIFIED_KEY, modifiedTime);
        lastUploadedJson.current = JSON.stringify(words);
      }
      initialSyncDone.current = true;
      setStatus('idle');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('error');
    }
  }, [words, replaceWords]);

  const signIn = useCallback(async () => {
    setError(null);
    setStatus('syncing');
    try {
      await driveSignIn();
      localStorage.setItem(SIGNED_IN_KEY, '1');
      setSignedIn(true);
      await performInitialSync();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus('signed-out');
    }
  }, [performInitialSync]);

  const signOut = useCallback(() => {
    driveSignOut();
    localStorage.removeItem(SIGNED_IN_KEY);
    localStorage.removeItem(LAST_MODIFIED_KEY);
    initialSyncDone.current = false;
    lastUploadedJson.current = null;
    setSignedIn(false);
    setStatus('signed-out');
    setError(null);
  }, []);

  useEffect(() => {
    if (!configured) return;
    if (localStorage.getItem(SIGNED_IN_KEY) !== '1') return;
    setSignedIn(true);
    setStatus('syncing');
    performInitialSync();
  }, [configured, performInitialSync]);

  useEffect(() => {
    if (!signedIn || !initialSyncDone.current) return;
    const json = JSON.stringify(words);
    if (json === lastUploadedJson.current) return;

    if (uploadTimer.current) clearTimeout(uploadTimer.current);
    setStatus('syncing');
    uploadTimer.current = setTimeout(async () => {
      try {
        if (!isSignedIn()) {
          // token expired and silent refresh would surface a popup — wait for next change
          return;
        }
        const modifiedTime = await uploadWords(words);
        localStorage.setItem(LAST_MODIFIED_KEY, modifiedTime);
        lastUploadedJson.current = json;
        setStatus('idle');
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setStatus('error');
      }
    }, UPLOAD_DEBOUNCE_MS);

    return () => {
      if (uploadTimer.current) clearTimeout(uploadTimer.current);
    };
  }, [words, signedIn]);

  return { status, error, signedIn, configured, signIn, signOut };
}
