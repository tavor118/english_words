import { useState, useEffect, useCallback } from 'react';
import type { Word } from '../types';
import { loadWords, saveWords } from '../utils/storage';

export function useWords() {
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    setWords(loadWords());
  }, []);

  useEffect(() => {
    if (words.length > 0) {
      saveWords(words);
    }
  }, [words]);

  const addWord = useCallback((word: Omit<Word, 'id' | 'createdAt' | 'correctCount' | 'incorrectCount' | 'lastReviewedAt' | 'nextReviewAt' | 'interval'>) => {
    const newWord: Word = {
      ...word,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      correctCount: 0,
      incorrectCount: 0,
      lastReviewedAt: null,
      nextReviewAt: Date.now(), // available for review immediately
      interval: 1,
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
