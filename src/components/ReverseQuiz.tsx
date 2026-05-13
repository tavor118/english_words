import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Word } from '../types';
import { shuffle } from '../utils/spaced-repetition';
import { getMinWordsForExercise, getWordsForExercise } from '../utils/exercise-progress';
import { useExerciseAnswer } from '../hooks/useExerciseAnswer';
import shared from '../styles/shared.module.css';
import s from './Quiz.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
  limit?: number;
  onComplete?: () => void;
}

export function ReverseQuiz({ words, onUpdate, onAnswer, limit, onComplete }: Props) {
  const [wordsSnapshot] = useState(words);
  const [quizWords] = useState<Word[]>(() => {
    const list = shuffle(getWordsForExercise(wordsSnapshot, 'reverseQuiz'));
    return limit ? list.slice(0, limit) : list;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const { stats: sessionStats, recordAnswer } = useExerciseAnswer('reverseQuiz', { onUpdate, onAnswer });
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const currentWord = quizWords[currentIndex];

  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = wordsSnapshot.filter((w) => w.id !== currentWord.id);
    const wrongAnswers = shuffle(others).slice(0, 3);
    return shuffle([
      ...wrongAnswers.map((w) => ({ id: w.id, word: w.word })),
      { id: currentWord.id, word: currentWord.word },
    ]);
  }, [currentWord, wordsSnapshot]);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selected || !currentWord) return;
      setSelected(optionId);
      recordAnswer(currentWord, optionId === currentWord.id);
    },
    [selected, currentWord, recordAnswer]
  );

  useEffect(() => {
    if (selected) nextBtnRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selected) return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < options.length) handleSelect(options[idx].id);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected, options, handleSelect]);

  const handleNext = () => {
    setSelected(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const minWords = getMinWordsForExercise('reverseQuiz');
  const cannotRun = words.length < minWords || quizWords.length === 0;
  const finished = currentIndex >= quizWords.length;
  const bail = cannotRun || finished;

  useEffect(() => {
    if (bail) onComplete?.();
  }, [bail, onComplete]);

  if (bail && onComplete) return null;

  if (words.length < minWords) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>Add at least {minWords} words to start the quiz!</p>
      </div>
    );
  }

  if (quizWords.length === 0) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>All words have passed Reverse Quiz. Reset a word's progress to practice again.</p>
      </div>
    );
  }

  if (currentIndex >= quizWords.length) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Reverse Quiz Complete!</h2>
          <div className={shared.sessionStats}>
            <span className={shared.statCorrect}>{sessionStats.correct} correct</span>
            <span className={shared.statIncorrect}>{sessionStats.incorrect} incorrect</span>
          </div>
        </div>
      </div>
    );
  }

  const getOptionClass = (optionId: string) => {
    if (!selected) return s.option;
    if (optionId === currentWord.id) return s.optionCorrect;
    if (optionId === selected) return s.optionIncorrect;
    return s.option;
  };

  return (
    <div className={s.container}>
      <div className={shared.progress}>
        {currentIndex + 1} / {quizWords.length}
      </div>

      <div className={s.question}>
        <h3>Which English word matches:</h3>
        <div className={s.wordRow}>
          <span className={s.word}>{currentWord.translation}</span>
        </div>
      </div>

      <div className={s.options}>
        {options.map((option, i) => (
          <button
            key={option.id}
            className={getOptionClass(option.id)}
            onClick={() => handleSelect(option.id)}
            disabled={!!selected}
          >
            <span className={s.optionNum}>{i + 1}</span>
            {option.word}
          </button>
        ))}
      </div>

      {selected && (
        <button ref={nextBtnRef} className={shared.btnPrimary} onClick={handleNext}>
          Next
        </button>
      )}
    </div>
  );
}
