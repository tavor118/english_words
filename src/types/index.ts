export const EXERCISE_KEYS = [
  'quiz',
  'reverseQuiz',
  'typing',
  'listening',
  'matchPairs',
  'scrambled',
] as const;

export type ExerciseKey = typeof EXERCISE_KEYS[number];

export type ExerciseProgress = Record<ExerciseKey, boolean>;

export const EXERCISE_LABELS: Record<ExerciseKey, string> = {
  quiz: 'Quiz',
  reverseQuiz: 'Reverse Quiz',
  typing: 'Typing',
  listening: 'Listening',
  matchPairs: 'Match Pairs',
  scrambled: 'Scrambled',
};

// FSRS scheduler state for a word (only updated by Flashcards).
// State: 0=New, 1=Learning, 2=Review, 3=Relearning. All times are ms timestamps.
export interface FsrsState {
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  learningSteps: number;
  state: number;
  lastReview: number | null;
}

// Lifetime count of each rating given to a word from Flashcards.
export interface RatingCounts {
  again: number;
  hard: number;
  good: number;
  easy: number;
}

// FSRS rating value: 1=Again, 2=Hard, 3=Good, 4=Easy.
export type RatingValue = 1 | 2 | 3 | 4;

export interface Word {
  id: string;
  word: string;
  translation: string;
  example: string;
  tags: string[];
  createdAt: number;
  // Per-rating lifetime counts from Flashcard reviews.
  ratings: RatingCounts;
  // Most recent rating given (drives the collapsed stats indicator). Null if never reviewed.
  lastRating: RatingValue | null;
  // FSRS scheduler state — only mutated by Flashcards.
  fsrs: FsrsState;
  favorite: boolean;
  imageUrl: string | null;
  audioUrl: string | null;
  // Per-exercise completion. A word is "learned" once all six are true.
  progress: ExerciseProgress;
  learnedAt: number | null;
}

export type View =
  | 'list'
  | 'add'
  | 'flashcard'
  | 'practice'
  | 'marathon';

export type PracticeView = ExerciseKey;
