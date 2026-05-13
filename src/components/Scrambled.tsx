import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { Word } from '../types';
import { shuffle } from '../utils/spaced-repetition';
import { getWordsForExercise } from '../utils/exercise-progress';
import { playWord } from '../utils/pronunciation';
import { useExerciseAnswer } from '../hooks/useExerciseAnswer';
import shared from '../styles/shared.module.css';
import s from './Scrambled.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
  limit?: number;
  onComplete?: () => void;
}

interface Tile {
  char: string;
  id: number;
}

function makeTiles(word: string): Tile[] {
  const letters = word.toLowerCase().replace(/\s+/g, '').split('');
  const tiles = letters.map((char, id) => ({ char, id }));
  for (let attempt = 0; attempt < 5; attempt++) {
    const shuffled = shuffle(tiles);
    if (shuffled.map((t) => t.char).join('') !== letters.join('')) {
      return shuffled;
    }
  }
  return shuffle(tiles);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

interface RoundProps {
  word: Word;
  onResolved: (correct: boolean) => void;
  onNext: () => void;
}

function ScrambledRound({ word, onResolved, onNext }: RoundProps) {
  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles(word.word));
  const [used, setUsed] = useState<number[]>([]);
  const [verdict, setVerdict] = useState<null | 'correct' | 'incorrect'>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  const target = useMemo(() => normalize(word.word), [word.word]);
  const built = used.map((idx) => tiles.find((t) => t.id === idx)?.char ?? '').join('');

  useEffect(() => {
    if (verdict) nextBtnRef.current?.focus();
  }, [verdict]);

  useEffect(() => {
    if (verdict) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') {
        if (used.length > 0) {
          e.preventDefault();
          setUsed((prev) => prev.slice(0, -1));
        }
        return;
      }
      if (e.key.length !== 1) return;
      const lower = e.key.toLowerCase();
      if (!/^[a-z]$/.test(lower)) return;
      const tile = tiles.find((t) => t.char === lower && !used.includes(t.id));
      if (!tile) return;
      const next = [...used, tile.id];
      setUsed(next);
      if (next.length === target.length) {
        const builtStr = next.map((idx) => tiles.find((t) => t.id === idx)?.char ?? '').join('');
        const correct = builtStr === target;
        setVerdict(correct ? 'correct' : 'incorrect');
        onResolved(correct);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [verdict, tiles, used, target, onResolved]);

  const handleTile = (id: number) => {
    if (verdict || used.includes(id)) return;
    const next = [...used, id];
    setUsed(next);
    if (next.length === target.length) {
      const builtStr = next.map((idx) => tiles.find((t) => t.id === idx)?.char ?? '').join('');
      const correct = builtStr === target;
      setVerdict(correct ? 'correct' : 'incorrect');
      onResolved(correct);
    }
  };

  const handleBackspace = () => {
    if (verdict || used.length === 0) return;
    setUsed((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (verdict) return;
    setUsed([]);
  };

  const handleRetry = () => {
    setUsed([]);
    setVerdict(null);
    setTiles(makeTiles(word.word));
  };

  return (
    <>
      <div className={s.question}>
        <h3>Unscramble the word for:</h3>
        <div className={s.translation}>{word.translation}</div>
        <div className={s.kbdHint}>Type letters or click tiles · Backspace to undo</div>
      </div>

      <div className={`${s.slots} ${verdict === 'correct' ? s.slotsCorrect : ''} ${verdict === 'incorrect' ? s.slotsIncorrect : ''}`}>
        {Array.from({ length: target.length }).map((_, i) => (
          <div key={i} className={s.slot}>
            {built[i] ?? ''}
          </div>
        ))}
      </div>

      <div className={s.tiles}>
        {tiles.map((tile) => (
          <button
            key={tile.id}
            className={used.includes(tile.id) ? s.tileUsed : s.tile}
            onClick={() => handleTile(tile.id)}
            disabled={used.includes(tile.id) || !!verdict}
          >
            {tile.char}
          </button>
        ))}
      </div>

      {!verdict && (
        <div className={s.controls}>
          <button className={shared.btnSecondary} onClick={handleBackspace} disabled={used.length === 0}>
            Backspace
          </button>
          <button className={shared.btnSecondary} onClick={handleClear} disabled={used.length === 0}>
            Clear
          </button>
        </div>
      )}

      {verdict === 'incorrect' && (
        <div className={s.reveal}>
          Correct answer: <strong>{word.word}</strong>
        </div>
      )}

      {verdict && (
        <div className={s.controls}>
          {verdict === 'incorrect' && (
            <button className={shared.btnSecondary} onClick={handleRetry}>
              Try Again
            </button>
          )}
          <button ref={nextBtnRef} className={shared.btnPrimary} onClick={onNext}>
            Next
          </button>
        </div>
      )}
    </>
  );
}

export function Scrambled({ words, onUpdate, onAnswer, limit, onComplete }: Props) {
  const [queue] = useState<Word[]>(() => {
    const list = shuffle(getWordsForExercise(words, 'scrambled'));
    return limit ? list.slice(0, limit) : list;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const { stats: sessionStats, recordAnswer } = useExerciseAnswer('scrambled', { onUpdate, onAnswer });

  const currentWord = queue[currentIndex];

  const handleResolved = useCallback(
    (correct: boolean) => {
      if (!currentWord) return;
      recordAnswer(currentWord, correct);
      playWord(currentWord.word, currentWord.audioUrl, (url) => onUpdate(currentWord.id, { audioUrl: url }));
    },
    [currentWord, onUpdate, recordAnswer]
  );

  const handleNext = () => setCurrentIndex((prev) => prev + 1);

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
        <p className={shared.emptyState}>All words have passed Scrambled. Reset a word's progress to practice again.</p>
      </div>
    );
  }

  if (currentIndex >= queue.length) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Scrambled Complete!</h2>
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
      <ScrambledRound
        key={currentWord.id}
        word={currentWord}
        onResolved={handleResolved}
        onNext={handleNext}
      />
    </div>
  );
}
