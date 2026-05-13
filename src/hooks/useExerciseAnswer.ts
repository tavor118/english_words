import { useCallback, useState } from 'react';
import type { ExerciseKey, Word } from '../types';
import { updateWordAfterReview } from '../utils/spaced-repetition';
import { markExercisePassed } from '../utils/exercise-progress';

interface Args {
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
}

export function useExerciseAnswer(exerciseKey: ExerciseKey, { onUpdate, onAnswer }: Args) {
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  const recordAnswer = useCallback(
    (word: Word, correct: boolean) => {
      const updated = updateWordAfterReview(word, correct);
      const progressUpdate = correct ? markExercisePassed(word, exerciseKey) : {};
      onUpdate(word.id, { ...updated, ...progressUpdate });
      setStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
      if (correct) onAnswer?.();
    },
    [exerciseKey, onUpdate, onAnswer]
  );

  return { stats, recordAnswer };
}
