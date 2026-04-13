import { useState, useCallback } from 'react';
import type { Word } from '../types';
import { getWordsForReview, shuffle, updateWordAfterReview } from '../utils/spaced-repetition';
import { PlayButton } from './PlayButton';
import shared from '../styles/shared.module.css';
import s from './Flashcard.module.css';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
}

export function Flashcard({ words, onUpdate }: Props) {
  const [reviewWords, setReviewWords] = useState<Word[]>(() => {
    const forReview = getWordsForReview(words);
    return shuffle(forReview.length > 0 ? forReview : words);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 });

  const currentWord = reviewWords[currentIndex];

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!currentWord) return;
      const updated = updateWordAfterReview(currentWord, correct);
      onUpdate(currentWord.id, updated);
      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));
      setFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentWord, onUpdate]
  );

  const handleRestart = () => {
    const forReview = getWordsForReview(words);
    setReviewWords(shuffle(forReview.length > 0 ? forReview : words));
    setCurrentIndex(0);
    setFlipped(false);
    setSessionStats({ correct: 0, incorrect: 0 });
  };

  if (words.length === 0) {
    return (
      <div className={s.container}>
        <p className={shared.emptyState}>Add some words first to start practicing!</p>
      </div>
    );
  }

  if (currentIndex >= reviewWords.length) {
    return (
      <div className={s.container}>
        <div className={shared.sessionComplete}>
          <h2>Session Complete!</h2>
          <div className={shared.sessionStats}>
            <span className={shared.statCorrect}>{sessionStats.correct} correct</span>
            <span className={shared.statIncorrect}>{sessionStats.incorrect} incorrect</span>
          </div>
          <button className={shared.btnPrimary} onClick={handleRestart}>
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={shared.progress}>
        {currentIndex + 1} / {reviewWords.length}
      </div>

      <div
        className={`${s.card} ${flipped ? s.flipped : ''}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={s.front}>
          <span className={s.label}>Word</span>
          <PlayButton
            word={currentWord.word}
            audioUrl={currentWord.audioUrl}
            onAudioUrlResolved={(url) => onUpdate(currentWord.id, { audioUrl: url })}
            size="md"
          />
          <span className={s.text}>{currentWord.word}</span>
          <span className={s.hint}>Click to flip</span>
        </div>
        <div className={s.back}>
          <span className={s.label}>Translation</span>
          <span className={s.text}>{currentWord.translation}</span>
          {currentWord.imageUrl && (
            <img src={currentWord.imageUrl} alt={currentWord.word} className={s.image} />
          )}
          {currentWord.example && (
            <span className={s.example}>"{currentWord.example}"</span>
          )}
        </div>
      </div>

      {flipped && (
        <div className={s.actions}>
          <button className={shared.btnIncorrect} onClick={() => handleAnswer(false)}>
            Don't Know
          </button>
          <button className={shared.btnCorrect} onClick={() => handleAnswer(true)}>
            Got It!
          </button>
        </div>
      )}
    </div>
  );
}
