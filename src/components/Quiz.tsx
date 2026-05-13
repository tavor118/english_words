import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Word } from '../types';
import { shuffle, updateWordAfterReview } from '../utils/spaced-repetition';
import { getWordsForExercise, markExercisePassed } from '../utils/exercise-progress';
import { playWord } from '../utils/pronunciation';
import { PlayButton } from './PlayButton';
import shared from '../styles/shared.module.css';
import s from './Quiz.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
  limit?: number;
  onComplete?: () => void;
}

export function Quiz({ words, onUpdate, onAnswer, limit, onComplete }: Props) {
  const [wordsSnapshot] = useState(words);
  const [quizWords] = useState<Word[]>(() => {
    const list = shuffle(getWordsForExercise(wordsSnapshot, 'quiz'));
    return limit ? list.slice(0, limit) : list;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const lastPlayedIndexRef = useRef(-1);

  const currentWord = quizWords[currentIndex];

  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = wordsSnapshot.filter((w) => w.id !== currentWord.id);
    const wrongAnswers = shuffle(others).slice(0, 3);
    return shuffle([
      ...wrongAnswers.map((w) => ({ id: w.id, translation: w.translation })),
      { id: currentWord.id, translation: currentWord.translation },
    ]);
  }, [currentWord, wordsSnapshot]);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selected || !currentWord) return;
      setSelected(optionId);
      const correct = optionId === currentWord.id;
      const updated = updateWordAfterReview(currentWord, correct);
      const progressUpdate = correct ? markExercisePassed(currentWord, 'quiz') : {};
      onUpdate(currentWord.id, { ...updated, ...progressUpdate });
      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
      if (correct) onAnswer?.();
    },
    [selected, currentWord, onUpdate, onAnswer]
  );

  useEffect(() => {
    if (selected) nextBtnRef.current?.focus();
  }, [selected]);

  useEffect(() => {
    if (!currentWord) return;
    if (lastPlayedIndexRef.current === currentIndex) return;
    lastPlayedIndexRef.current = currentIndex;
    playWord(currentWord.word, currentWord.audioUrl, (url) => onUpdate(currentWord.id, { audioUrl: url }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

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

  const cannotRun = words.length < 4 || quizWords.length === 0;
  const finished = currentIndex >= quizWords.length;
  const bail = cannotRun || finished;

  useEffect(() => {
    if (bail) onComplete?.();
  }, [bail, onComplete]);

  if (bail && onComplete) return null;

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
        <p className={shared.emptyState}>All words have passed the Quiz exercise! Reset progress on a word to practice again.</p>
      </div>
    );
  }

  if (currentIndex >= quizWords.length) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Quiz Complete!</h2>
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
        <h3>What is the translation of:</h3>
        <div className={s.wordRow}>
          <PlayButton
            word={currentWord.word}
            audioUrl={currentWord.audioUrl}
            onAudioUrlResolved={(url) => onUpdate(currentWord.id, { audioUrl: url })}
            size="md"
          />
          <span className={s.word}>{currentWord.word}</span>
        </div>
        {currentWord.example && (
          <p className={s.example}>"{currentWord.example}"</p>
        )}
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
            {option.translation}
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
