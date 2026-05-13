import type { ExerciseKey, Word } from '../types';
import { Quiz } from './Quiz';
import { ReverseQuiz } from './ReverseQuiz';
import { Typing } from './Typing';
import { Listening } from './Listening';
import { MatchPairs } from './MatchPairs';
import { Scrambled } from './Scrambled';

interface Props {
  type: ExerciseKey;
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
  limit?: number;
  onComplete?: () => void;
}

export function ExerciseRenderer({ type, ...props }: Props) {
  switch (type) {
    case 'quiz': return <Quiz {...props} />;
    case 'reverseQuiz': return <ReverseQuiz {...props} />;
    case 'typing': return <Typing {...props} />;
    case 'listening': return <Listening {...props} />;
    case 'matchPairs': return <MatchPairs {...props} />;
    case 'scrambled': return <Scrambled {...props} />;
  }
}
