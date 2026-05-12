import { useState, useEffect, useCallback, useRef } from 'react';
import type { Word, ExerciseProgress } from '../types';
import { EXERCISE_KEYS } from '../types';
import { loadWords, saveWords } from '../utils/storage';

export type NewWordInput = Pick<Word, 'word' | 'translation' | 'example' | 'tags'> & {
  imageUrl?: string | null;
  audioUrl?: string | null;
};

export function useWords() {
  const [words, setWords] = useState<Word[]>(() => loadWords());
  const initialLoadDone = useRef(false);

  useEffect(() => {
    initialLoadDone.current = true;
  }, []);

  useEffect(() => {
    if (initialLoadDone.current) {
      saveWords(words);
    }
  }, [words]);

  const addWord = useCallback((input: NewWordInput) => {
    const progress = EXERCISE_KEYS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as ExerciseProgress);
    const newWord: Word = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      correctCount: 0,
      incorrectCount: 0,
      lastReviewedAt: null,
      nextReviewAt: Date.now(),
      interval: 1,
      favorite: false,
      imageUrl: input.imageUrl ?? null,
      audioUrl: input.audioUrl ?? null,
      progress,
      learnedAt: null,
    };
    setWords((prev) => [...prev, newWord]);
  }, []);

  const updateWord = useCallback((id: string, updates: Partial<Word>) => {
    setWords((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const deleteWord = useCallback((id: string) => {
    setWords((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const replaceWords = useCallback((newWords: Word[]) => {
    setWords(newWords);
    saveWords(newWords);
  }, []);

  return { words, addWord, updateWord, deleteWord, replaceWords };
}
