import { type Card, createEmptyCard, fsrs, Rating } from 'ts-fsrs';
import type { FsrsState, Word } from '../types';

const scheduler = fsrs();

export const RATING_AGAIN = Rating.Again;
export const RATING_HARD = Rating.Hard;
export const RATING_GOOD = Rating.Good;
export const RATING_EASY = Rating.Easy;
export type FsrsRating = typeof RATING_AGAIN | typeof RATING_HARD | typeof RATING_GOOD | typeof RATING_EASY;

export function createInitialFsrsState(): FsrsState {
  return toFsrsState(createEmptyCard(new Date()));
}

function toFsrsState(card: Card): FsrsState {
  return {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    learningSteps: card.learning_steps,
    state: card.state,
    lastReview: card.last_review ? card.last_review.getTime() : null,
  };
}

function toCard(state: FsrsState): Card {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    reps: state.reps,
    lapses: state.lapses,
    learning_steps: state.learningSteps,
    state: state.state,
    last_review: state.lastReview ? new Date(state.lastReview) : undefined,
  };
}

export function scheduleReview(state: FsrsState, rating: FsrsRating, now: Date = new Date()): FsrsState {
  const result = scheduler.next(toCard(state), now, rating);
  return toFsrsState(result.card);
}

export function getWordsForReview(words: Word[]): Word[] {
  const now = Date.now();
  return words
    .filter((w) => w.fsrs.due <= now)
    .sort((a, b) => a.fsrs.due - b.fsrs.due);
}

export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
