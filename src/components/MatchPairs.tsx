import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Word } from '../types';
import { shuffle } from '../utils/spaced-repetition';
import { getMinWordsForExercise, getWordsForExercise } from '../utils/exercise-progress';
import { useExerciseAnswer } from '../hooks/useExerciseAnswer';
import shared from '../styles/shared.module.css';
import s from './MatchPairs.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
  limit?: number;
  onComplete?: () => void;
}

const ROUND_SIZE = 5;
const EN_KEYS = ['1', '2', '3', '4', '5'];
const UA_KEYS = ['6', '7', '8', '9', '0'];

interface RoundProps {
  round: Word[];
  roundNumber: number;
  totalRounds: number;
  onMatched: (word: Word, correct: boolean) => void;
  onRoundComplete: () => void;
}

function MatchPairsRound({ round, roundNumber, totalRounds, onMatched, onRoundComplete }: RoundProps) {
  const [enOrder] = useState<Word[]>(() => shuffle(round));
  const [uaOrder] = useState<Word[]>(() => shuffle(round));
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [selectedUa, setSelectedUa] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<{ en: string; ua: string } | null>(null);

  const allMatched = matchedIds.size === round.length && round.length > 0;

  useEffect(() => {
    if (!allMatched) return;
    const t = setTimeout(onRoundComplete, 400);
    return () => clearTimeout(t);
  }, [allMatched, onRoundComplete]);

  const wordById = useMemo(() => {
    const m = new Map<string, Word>();
    for (const w of round) m.set(w.id, w);
    return m;
  }, [round]);

  const evaluate = useCallback(
    (enId: string, uaId: string) => {
      const w = wordById.get(enId);
      if (!w) return;
      const correct = enId === uaId;
      onMatched(w, correct);
      if (correct) {
        setMatchedIds((prev) => new Set(prev).add(enId));
        setSelectedEn(null);
        setSelectedUa(null);
      } else {
        setWrong({ en: enId, ua: uaId });
        setTimeout(() => {
          setWrong(null);
          setSelectedEn(null);
          setSelectedUa(null);
        }, 600);
      }
    },
    [wordById, onMatched]
  );

  const handleSelectEn = useCallback(
    (id: string) => {
      if (matchedIds.has(id) || wrong) return;
      setSelectedEn(id);
      if (selectedUa) evaluate(id, selectedUa);
    },
    [matchedIds, selectedUa, wrong, evaluate]
  );

  const handleSelectUa = useCallback(
    (id: string) => {
      if (matchedIds.has(id) || wrong) return;
      setSelectedUa(id);
      if (selectedEn) evaluate(selectedEn, id);
    },
    [matchedIds, selectedEn, wrong, evaluate]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const enIdx = EN_KEYS.indexOf(e.key);
      if (enIdx >= 0 && enIdx < enOrder.length) {
        handleSelectEn(enOrder[enIdx].id);
        return;
      }
      const uaIdx = UA_KEYS.indexOf(e.key);
      if (uaIdx >= 0 && uaIdx < uaOrder.length) {
        handleSelectUa(uaOrder[uaIdx].id);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enOrder, uaOrder, handleSelectEn, handleSelectUa]);

  const cellClass = (id: string, side: 'en' | 'ua', selected: string | null) => {
    if (matchedIds.has(id)) return s.cellMatched;
    if (wrong && wrong[side] === id) return s.cellWrong;
    if (selected === id) return s.cellSelected;
    return s.cell;
  };

  return (
    <>
      <div className={shared.progress}>
        {totalRounds > 1 && `Set ${roundNumber} / ${totalRounds} · `}
        {matchedIds.size} / {round.length} matched
      </div>

      <div className={s.grid}>
        <div className={s.col}>
          {enOrder.map((w, i) => (
            <button
              key={w.id}
              className={cellClass(w.id, 'en', selectedEn)}
              onClick={() => handleSelectEn(w.id)}
              disabled={matchedIds.has(w.id)}
            >
              <span className={s.cellNum}>{EN_KEYS[i]}</span>
              {w.word}
            </button>
          ))}
        </div>
        <div className={s.col}>
          {uaOrder.map((w, i) => (
            <button
              key={w.id}
              className={cellClass(w.id, 'ua', selectedUa)}
              onClick={() => handleSelectUa(w.id)}
              disabled={matchedIds.has(w.id)}
            >
              <span className={s.cellNum}>{UA_KEYS[i]}</span>
              {w.translation}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export function MatchPairs({ words, onUpdate, onAnswer, limit, onComplete }: Props) {
  const [pool] = useState<Word[]>(() => {
    const cap = limit ?? ROUND_SIZE;
    return shuffle(getWordsForExercise(words, 'matchPairs')).slice(0, cap);
  });
  const rounds = useMemo<Word[][]>(() => {
    const chunks: Word[][] = [];
    for (let i = 0; i < pool.length; i += ROUND_SIZE) {
      chunks.push(pool.slice(i, i + ROUND_SIZE));
    }
    return chunks;
  }, [pool]);
  const [roundIndex, setRoundIndex] = useState(0);
  const { stats: sessionStats, recordAnswer } = useExerciseAnswer('matchPairs', { onUpdate, onAnswer });

  const minWords = getMinWordsForExercise('matchPairs');
  const finished = roundIndex >= rounds.length;
  const cannotRun = words.length < minWords || pool.length === 0;
  const bail = cannotRun || finished;

  useEffect(() => {
    if (bail) onComplete?.();
  }, [bail, onComplete]);

  if (bail && onComplete) return null;

  if (words.length < minWords) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>Add at least {minWords} words to play Match Pairs.</p>
      </div>
    );
  }

  if (pool.length === 0) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>All words have passed Match Pairs. Reset a word's progress to practice again.</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Match Pairs Complete!</h2>
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
      <MatchPairsRound
        key={roundIndex}
        round={rounds[roundIndex]}
        roundNumber={roundIndex + 1}
        totalRounds={rounds.length}
        onMatched={recordAnswer}
        onRoundComplete={() => setRoundIndex((i) => i + 1)}
      />
    </div>
  );
}
