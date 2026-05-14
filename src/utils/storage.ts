import type { RatingCounts, Word, ExerciseProgress } from '../types';
import { EXERCISE_KEYS } from '../types';
import { createInitialFsrsState } from './spaced-repetition';

const STORAGE_KEY = 'english-words';

function emptyProgress(): ExerciseProgress {
  return EXERCISE_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as ExerciseProgress);
}

function emptyRatings(): RatingCounts {
  return { again: 0, hard: 0, good: 0, easy: 0 };
}

function migrateWord(raw: Partial<Word>): Word {
  const existing = raw.progress as Partial<ExerciseProgress> | undefined;
  const progress = emptyProgress();
  if (existing) {
    for (const key of EXERCISE_KEYS) {
      if (existing[key]) progress[key] = true;
    }
  }
  const allPassed = EXERCISE_KEYS.every((k) => progress[k]);
  // Legacy fields dropped on load: interval/lastReviewedAt/nextReviewAt (replaced by FSRS),
  // correctCount/incorrectCount (replaced by per-rating ratings).
  return {
    id: raw.id ?? crypto.randomUUID(),
    word: raw.word ?? '',
    translation: raw.translation ?? '',
    example: raw.example ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.createdAt ?? Date.now(),
    ratings: raw.ratings ?? emptyRatings(),
    lastRating: raw.lastRating ?? null,
    fsrs: raw.fsrs ?? createInitialFsrsState(),
    favorite: raw.favorite ?? false,
    imageUrl: raw.imageUrl ?? null,
    audioUrl: raw.audioUrl ?? null,
    progress,
    learnedAt: raw.learnedAt ?? (allPassed ? Date.now() : null),
  };
}

export function migrateWords(words: Partial<Word>[]): Word[] {
  return words.map(migrateWord);
}

function mergeRatings(a: RatingCounts, b: RatingCounts): RatingCounts {
  return {
    again: Math.max(a.again, b.again),
    hard: Math.max(a.hard, b.hard),
    good: Math.max(a.good, b.good),
    easy: Math.max(a.easy, b.easy),
  };
}

function mergeWord(a: Word, b: Word): Word {
  const progress = EXERCISE_KEYS.reduce((acc, key) => {
    acc[key] = a.progress[key] || b.progress[key];
    return acc;
  }, {} as ExerciseProgress);
  const learnedTimes = [a.learnedAt, b.learnedAt].filter((t): t is number => t != null);
  // FSRS state and lastRating co-evolve from the same review event — pick them as a coupled
  // pair from whichever side has the more recent review, instead of merging field-by-field.
  const fsrsWinner = (a.fsrs.lastReview ?? 0) >= (b.fsrs.lastReview ?? 0) ? a : b;
  return {
    id: a.id,
    word: a.word || b.word,
    translation: a.translation || b.translation,
    example: a.example || b.example,
    tags: Array.from(new Set([...a.tags, ...b.tags])),
    createdAt: Math.min(a.createdAt, b.createdAt),
    ratings: mergeRatings(a.ratings, b.ratings),
    lastRating: fsrsWinner.lastRating,
    fsrs: fsrsWinner.fsrs,
    favorite: a.favorite || b.favorite,
    imageUrl: a.imageUrl ?? b.imageUrl,
    audioUrl: a.audioUrl ?? b.audioUrl,
    progress,
    learnedAt: learnedTimes.length ? Math.min(...learnedTimes) : null,
  };
}

export function mergeWordLists(local: Word[], remote: Word[]): Word[] {
  const remoteById = new Map(remote.map((w) => [w.id, w]));
  const seen = new Set<string>();
  const merged: Word[] = [];
  for (const w of local) {
    const r = remoteById.get(w.id);
    merged.push(r ? mergeWord(w, r) : w);
    seen.add(w.id);
  }
  for (const w of remote) {
    if (!seen.has(w.id)) merged.push(w);
  }
  return merged;
}

export function loadWords(): Word[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  return migrateWords(JSON.parse(data));
}

export function saveWords(words: Word[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

export function exportWords(words: Word[]): void {
  const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `english-words-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importWords(file: File): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const words = JSON.parse(e.target?.result as string);
        if (!Array.isArray(words)) throw new Error('Invalid format');
        resolve(migrateWords(words));
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
