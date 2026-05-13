import type { Word, ExerciseProgress } from '../types';
import { EXERCISE_KEYS } from '../types';

const STORAGE_KEY = 'english-words';

function emptyProgress(): ExerciseProgress {
  return EXERCISE_KEYS.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as ExerciseProgress);
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
  return {
    id: raw.id ?? crypto.randomUUID(),
    word: raw.word ?? '',
    translation: raw.translation ?? '',
    example: raw.example ?? '',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    createdAt: raw.createdAt ?? Date.now(),
    correctCount: raw.correctCount ?? 0,
    incorrectCount: raw.incorrectCount ?? 0,
    lastReviewedAt: raw.lastReviewedAt ?? null,
    nextReviewAt: raw.nextReviewAt ?? Date.now(),
    interval: raw.interval ?? 1,
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
