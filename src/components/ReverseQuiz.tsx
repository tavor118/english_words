import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Word } from '../types';
import { shuffle, updateWordAfterReview } from '../utils/spaced-repetition';
import { getWordsForExercise, markExercisePassed } from '../utils/exercise-progress';
import shared from '../styles/shared.module.css';
import s from './Quiz.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
}

export function ReverseQuiz({ words, onUpdate }: Props) {
  const [wordsSnapshot] = useState(words);
  const [quizWords] = useState<Word[]>(() =>
    shuffle(getWordsForExercise(wordsSnapshot, 'reverseQuiz'))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const currentWord = quizWords[currentIndex];

  useEffect(() => {
    if (selected) nextBtnRef.current?.focus();
  }, [selected]);

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
      const correct = optionId === currentWord.id;
      const updated = updateWordAfterReview(currentWord, correct);
      const progressUpdate = correct ? markExercisePassed(currentWord, 'reverseQuiz') : {};
      onUpdate(currentWord.id, { ...updated, ...progressUpdate });
      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
    },
    [selected, currentWord, onUpdate]
  );

  const handleNext = () => {
    setSelected(null);
    setCurrentIndex((prev) => prev + 1);
  };

  if (words.length < 4) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>Add at least 4 words to start the quiz!</p>
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
        {options.map((option) => (
          <button
            key={option.id}
            className={getOptionClass(option.id)}
            onClick={() => handleSelect(option.id)}
            disabled={!!selected}
          >
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
