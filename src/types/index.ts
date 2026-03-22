export interface Word {
  id: string;
  word: string;
  translation: string;
  example: string;
  tags: string[];
  createdAt: number;
  // Spaced repetition fields
  correctCount: number;
  incorrectCount: number;
  lastReviewedAt: number | null;
  nextReviewAt: number;
  interval: number; // days until next review
  favorite: boolean;
}

export type QuizMode = 'flashcard' | 'typing' | 'choice';

export interface QuizResult {
  wordId: string;
  correct: boolean;
  timestamp: number;
}

export type View = 'list' | 'add' | 'quiz' | 'flashcard';
