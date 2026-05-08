import { useState, useMemo, useCallback, useRef } from 'react';
import type { Word } from '../types';
import { shuffle, updateWordAfterReview, getWordsForReview } from '../utils/spaced-repetition';
import { PlayButton } from './PlayButton';
import shared from '../styles/shared.module.css';
import s from './Quiz.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
}

export function Quiz({ words, onUpdate }: Props) {
  const [quizWords, setQuizWords] = useState<Word[]>(() => {
    const forReview = getWordsForReview(words);
    return shuffle(forReview.length >= 4 ? forReview : words);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  const currentWord = quizWords[currentIndex];

  const wordsRef = useRef(words);
  wordsRef.current = words;

  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = wordsRef.current.filter((w) => w.id !== currentWord.id);
    const wrongAnswers = shuffle(others).slice(0, 3);
    return shuffle([
      ...wrongAnswers.map((w) => ({ id: w.id, translation: w.translation })),
      { id: currentWord.id, translation: currentWord.translation },
    ]);
  }, [currentWord]);

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selected || !currentWord) return;
      setSelected(optionId);
      const correct = optionId === currentWord.id;
      const updated = updateWordAfterReview(currentWord, correct);
      onUpdate(currentWord.id, updated);
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

  const handleRestart = () => {
    const forReview = getWordsForReview(words);
    setQuizWords(shuffle(forReview.length >= 4 ? forReview : words));
    setCurrentIndex(0);
    setSelected(null);
    setSessionStats({ correct: 0, incorrect: 0 });
  };

  if (words.length < 4) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>Add at least 4 words to start the quiz!</p>
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
          <button className={shared.btnPrimary} onClick={handleRestart}>
            Try Again
          </button>
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
        {options.map((option) => (
          <button
            key={option.id}
            className={getOptionClass(option.id)}
            onClick={() => handleSelect(option.id)}
            disabled={!!selected}
          >
            {option.translation}
          </button>
        ))}
      </div>

      {selected && (
        <button className={shared.btnPrimary} onClick={handleNext}>
          Next
        </button>
      )}
    </div>
  );
}
