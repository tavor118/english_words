import { useState, useCallback, useRef, useEffect } from 'react';
import type { Word } from '../types';
import { shuffle } from '../utils/spaced-repetition';
import { getWordsForExercise } from '../utils/exercise-progress';
import { pronounce } from '../utils/pronunciation';
import { normalizeAnswer } from '../utils/string';
import { useExerciseAnswer } from '../hooks/useExerciseAnswer';
import { PlayButton } from './PlayButton';
import shared from '../styles/shared.module.css';
import s from './Typing.module.css';
import l from './Listening.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
  limit?: number;
  onComplete?: () => void;
}

export function Listening({ words, onUpdate, onAnswer, limit, onComplete }: Props) {
  const [queue] = useState<Word[]>(() => {
    const list = shuffle(getWordsForExercise(words, 'listening'));
    return limit ? list.slice(0, limit) : list;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState<null | 'correct' | 'incorrect'>(null);
  const { stats: sessionStats, recordAnswer } = useExerciseAnswer('listening', { onUpdate, onAnswer });
  const inputRef = useRef<HTMLInputElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const currentWord = queue[currentIndex];
  const lastPlayedIndexRef = useRef(-1);

  useEffect(() => {
    inputRef.current?.focus();
    if (currentWord && lastPlayedIndexRef.current !== currentIndex) {
      lastPlayedIndexRef.current = currentIndex;
      pronounce(currentWord.word).catch(() => {});
    }
  }, [currentIndex, currentWord]);

  useEffect(() => {
    if (verdict) nextBtnRef.current?.focus();
  }, [verdict]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (verdict || !currentWord) return;
      const correct = normalizeAnswer(input) === normalizeAnswer(currentWord.word);
      recordAnswer(currentWord, correct);
      setVerdict(correct ? 'correct' : 'incorrect');
    },
    [verdict, currentWord, input, recordAnswer]
  );

  const handleNext = () => {
    setVerdict(null);
    setInput('');
    setCurrentIndex((prev) => prev + 1);
  };

  const cannotRun = words.length === 0 || queue.length === 0;
  const finished = currentIndex >= queue.length;
  const bail = cannotRun || finished;

  useEffect(() => {
    if (bail) onComplete?.();
  }, [bail, onComplete]);

  if (bail && onComplete) return null;

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
        <p className={shared.emptyState}>All words have passed Listening. Reset a word's progress to practice again.</p>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Listening Complete!</h2>
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
        <h3>Listen and type what you hear:</h3>
        <div className={l.playWrap}>
          <PlayButton
            key={currentWord.id}
            word={currentWord.word}
            audioUrl={currentWord.audioUrl}
            onAudioUrlResolved={(url) => onUpdate(currentWord.id, { audioUrl: url })}
            size="md"
          />
        </div>
        {verdict && (
          <div className={l.hint}>Translation: <strong>{currentWord.translation}</strong></div>
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
          placeholder="type what you hear"
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
