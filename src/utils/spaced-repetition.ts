import type { Word } from '../types';

const MIN_INTERVAL = 1;
const MAX_INTERVAL = 365;

export function updateWordAfterReview(word: Word, correct: boolean): Word {
  const now = Date.now();

  if (correct) {
    const newInterval = Math.min(word.interval * 2.5, MAX_INTERVAL);
    return {
      ...word,
      correctCount: word.correctCount + 1,
      lastReviewedAt: now,
      nextReviewAt: now + newInterval * 24 * 60 * 60 * 1000,
      interval: newInterval,
    };
  }

  return {
    ...word,
    incorrectCount: word.incorrectCount + 1,
    lastReviewedAt: now,
    nextReviewAt: now + MIN_INTERVAL * 24 * 60 * 60 * 1000,
    interval: MIN_INTERVAL,
  };
}

export function getWordsForReview(words: Word[]): Word[] {
  const now = Date.now();
  return words
    .filter((w) => w.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
