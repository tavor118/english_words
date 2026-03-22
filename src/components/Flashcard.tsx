import { useState, useCallback } from 'react';
import type { Word } from '../types';
import { getWordsForReview, shuffle, updateWordAfterReview } from '../utils/spaced-repetition';

interface Props {
  words: Word[];
  onUpdate: (id: string, updates: Partial<Word>) => void;
}

export function Flashcard({ words, onUpdate }: Props) {
  const [reviewWords, setReviewWords] = useState<Word[]>(() =>
    shuffle(getWordsForReview(words).length > 0 ? getWordsForReview(words) : words)
  );
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
      <div className="flashcard-container">
        <p className="empty-state">Add some words first to start practicing!</p>
      </div>
    );
  }

  if (currentIndex >= reviewWords.length) {
    return (
      <div className="flashcard-container">
        <div className="session-complete">
          <h2>Session Complete!</h2>
          <div className="session-stats">
            <span className="stat correct">{sessionStats.correct} correct</span>
            <span className="stat incorrect">{sessionStats.incorrect} incorrect</span>
          </div>
          <button className="btn btn-primary" onClick={handleRestart}>
            Practice Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcard-container">
      <div className="flashcard-progress">
        {currentIndex + 1} / {reviewWords.length}
      </div>

      <div
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flashcard-front">
          <span className="flashcard-label">Word</span>
          <span className="flashcard-text">{currentWord.word}</span>
          <span className="flashcard-hint">Click to flip</span>
        </div>
        <div className="flashcard-back">
          <span className="flashcard-label">Translation</span>
          <span className="flashcard-text">{currentWord.translation}</span>
          {currentWord.imageUrl && (
            <img src={currentWord.imageUrl} alt={currentWord.word} className="flashcard-image" />
          )}
          {currentWord.example && (
            <span className="flashcard-example">"{currentWord.example}"</span>
          )}
        </div>
      </div>

      {flipped && (
        <div className="flashcard-actions">
          <button className="btn btn-incorrect" onClick={() => handleAnswer(false)}>
            Don't Know
          </button>
          <button className="btn btn-correct" onClick={() => handleAnswer(true)}>
            Got It!
          </button>
        </div>
      )}
    </div>
  );
}
