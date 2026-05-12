import { useState, useCallback, useRef, useEffect } from 'react';
import type { Word } from '../types';
import { shuffle, updateWordAfterReview } from '../utils/spaced-repetition';
import { getWordsForExercise, markExercisePassed } from '../utils/exercise-progress';
import shared from '../styles/shared.module.css';
import s from './Typing.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function Typing({ words, onUpdate }: Props) {
  const [queue] = useState<Word[]>(() => shuffle(getWordsForExercise(words, 'typing')));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<null | 'correct' | 'incorrect'>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const currentWord = queue[currentIndex];

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    if (verdict) nextBtnRef.current?.focus();
  }, [verdict]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (verdict || !currentWord) return;
      const correct = normalize(input) === normalize(currentWord.word);
      const updated = updateWordAfterReview(currentWord, correct);
      const progressUpdate = correct ? markExercisePassed(currentWord, 'typing') : {};
      onUpdate(currentWord.id, { ...updated, ...progressUpdate });
      setVerdict(correct ? 'correct' : 'incorrect');
      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
    },
    [verdict, currentWord, input, onUpdate]
  );

  const handleNext = () => {
    setVerdict(null);
    setInput('');
    setCurrentIndex((prev) => prev + 1);
  };

  if (words.length === 0) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>Add some words first to start practicing!</p>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>All words have passed Typing. Reset a word's progress to practice again.</p>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Typing Complete!</h2>
          <div className={shared.sessionStats}>
            <span className={shared.statCorrect}>{sessionStats.correct} correct</span>
            <span className={shared.statIncorrect}>{sessionStats.incorrect} incorrect</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={shared.progress}>
        {currentIndex + 1} / {queue.length}
      </div>

      <div className={s.question}>
        <h3>Type the English word for:</h3>
        <div className={s.translation}>{currentWord.translation}</div>
        {currentWord.imageUrl && (
          <img src={currentWord.imageUrl} alt="" className={s.image} />
        )}
      </div>

      <form onSubmit={handleSubmit} className={s.form}>
        <input
          ref={inputRef}
          className={`${shared.input} ${s.input} ${verdict === 'correct' ? s.inputCorrect : ''} ${verdict === 'incorrect' ? s.inputIncorrect : ''}`}
          type="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!verdict}
          placeholder="type here"
        />
        {!verdict && (
          <button type="submit" className={shared.btnPrimary} disabled={!input.trim()}>
            Check
          </button>
        )}
      </form>

      {verdict === 'incorrect' && (
        <div className={s.reveal}>
          Correct answer: <strong>{currentWord.word}</strong>
        </div>
      )}

      {verdict && (
        <button ref={nextBtnRef} className={shared.btnPrimary} onClick={handleNext}>
          Next
        </button>
      )}
    </div>
  );
}
