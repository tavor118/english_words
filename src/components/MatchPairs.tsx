import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Word } from '../types';
import { shuffle, updateWordAfterReview } from '../utils/spaced-repetition';
import { getWordsForExercise, markExercisePassed } from '../utils/exercise-progress';
import shared from '../styles/shared.module.css';
import s from './MatchPairs.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onAnswer?: () => void;
}

const ROUND_SIZE = 5;
const EN_KEYS = ['1', '2', '3', '4', '5'];
const UA_KEYS = ['6', '7', '8', '9', '0'];

export function MatchPairs({ words, onUpdate, onAnswer }: Props) {
  const [round] = useState<Word[]>(() =>
    shuffle(getWordsForExercise(words, 'matchPairs')).slice(0, ROUND_SIZE)
  );
  const [enOrder] = useState<Word[]>(() => shuffle(round));
  const [uaOrder] = useState<Word[]>(() => shuffle(round));
  const [selectedEn, setSelectedEn] = useState<string | null>(null);
  const [selectedUa, setSelectedUa] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<{ en: string; ua: string } | null>(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  const allMatched = matchedIds.size === round.length && round.length > 0;

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
      const updated = updateWordAfterReview(w, correct);
      const progressUpdate = correct ? markExercisePassed(w, 'matchPairs') : {};
      onUpdate(w.id, { ...updated, ...progressUpdate });
      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
      if (correct) {
        onAnswer?.();
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
    [wordById, onUpdate, onAnswer]
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

  if (words.length < 2) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>Add at least 2 words to play Match Pairs.</p>
      </div>
    );
  }

  if (round.length === 0) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>All words have passed Match Pairs. Reset a word's progress to practice again.</p>
      </div>
    );
  }

  if (allMatched) {
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

  const cellClass = (id: string, side: 'en' | 'ua', selected: string | null) => {
    if (matchedIds.has(id)) return s.cellMatched;
    if (wrong && wrong[side] === id) return s.cellWrong;
    if (selected === id) return s.cellSelected;
    return s.cell;
  };

  return (
    <div className={s.container}>
      <div className={shared.progress}>
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
    </div>
  );
}
