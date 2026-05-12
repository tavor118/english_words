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

export interface Word {
  id: string;
  word: string;
  translation: string;
  example: string;
  tags: string[];
  createdAt: number;
  // Spaced repetition fields (used by Flashcards)
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: number | null;
  nextReviewAt: number;
  interval: number; // days until next review
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
