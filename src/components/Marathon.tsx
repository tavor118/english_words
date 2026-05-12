import { useState, useCallback, useEffect, useRef } from 'react';
import type { Word, ExerciseKey } from '../types';
import { EXERCISE_KEYS, EXERCISE_LABELS } from '../types';
import { Quiz } from './Quiz';
import { ReverseQuiz } from './ReverseQuiz';
import { Typing } from './Typing';
import { Listening } from './Listening';
import { MatchPairs } from './MatchPairs';
import { Scrambled } from './Scrambled';
import shared from '../styles/shared.module.css';
import s from './Marathon.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer: () => void;
}

const WORDS_PER_EXERCISE = 10;
const SEQUENCE: ExerciseKey[] = [...EXERCISE_KEYS];

export function Marathon({ words, onUpdate, onAnswer }: Props) {
  const [sessionToken, setSessionToken] = useState(0);
  const [step, setStep] = useState(0);
  const restartBtnRef = useRef<HTMLButtonElement>(null);

  const handleComplete = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const done = step >= SEQUENCE.length;

  useEffect(() => {
    if (done) restartBtnRef.current?.focus();
  }, [done]);

  if (done) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Marathon Complete!</h2>
          <p className={s.completeNote}>
            All six exercises done. Go again, or open Practice to focus on something specific.
          </p>
          <button
            ref={restartBtnRef}
            className={shared.btnPrimary}
            onClick={() => {
              setStep(0);
              setSessionToken((t) => t + 1);
            }}
          >
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  const currentKey = SEQUENCE[step];
  const exerciseKey = `${sessionToken}-${currentKey}`;
  const commonProps = {
    key: exerciseKey,
    words,
    onUpdate,
    onAnswer,
    limit: WORDS_PER_EXERCISE,
    onComplete: handleComplete,
  };

  const exerciseElement = () => {
    switch (currentKey) {
      case 'quiz': return <Quiz {...commonProps} />;
      case 'reverseQuiz': return <ReverseQuiz {...commonProps} />;
      case 'typing': return <Typing {...commonProps} />;
      case 'listening': return <Listening {...commonProps} />;
      case 'matchPairs': return <MatchPairs {...commonProps} />;
      case 'scrambled': return <Scrambled {...commonProps} />;
    }
  };

  return (
    <div className={s.container}>
      <div className={s.progress}>
        <span className={s.stepCount}>Exercise {step + 1} of {SEQUENCE.length}</span>
        <span className={s.stepLabel}>{EXERCISE_LABELS[currentKey]}</span>
        <div className={s.dots}>
          {SEQUENCE.map((k, i) => (
            <span
              key={k}
              className={i < step ? s.dotDone : i === step ? s.dotActive : s.dotPending}
              title={EXERCISE_LABELS[k]}
            />
          ))}
        </div>
      </div>
      {exerciseElement()}
    </div>
  );
}
