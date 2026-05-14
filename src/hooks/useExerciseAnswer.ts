import { useCallback, useState } from 'react';
import type { ExerciseKey, Word } from '../types';
import { markExercisePassed } from '../utils/exercise-progress';

interface Args {
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
}

export function useExerciseAnswer(exerciseKey: ExerciseKey, { onUpdate, onAnswer }: Args) {
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  const recordAnswer = useCallback(
    (word: Word, correct: boolean) => {
      if (correct) {
        onUpdate(word.id, markExercisePassed(word, exerciseKey));
        onAnswer?.();
      }
      setStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
    },
    [exerciseKey, onUpdate, onAnswer]
  );

  return { stats, recordAnswer };
}
