import { useState, useMemo, useCallback } from 'react';
import type { Word } from '../types';
import { shuffle, updateWordAfterReview, getWordsForReview } from '../utils/spaced-repetition';
import { PlayButton } from './PlayButton';

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

  const options = useMemo(() => {
    if (!currentWord) return [];
    const others = words.filter((w) => w.id !== currentWord.id);
    const wrongAnswers = shuffle(others).slice(0, 3);
    return shuffle([
      ...wrongAnswers.map((w) => ({ id: w.id, translation: w.translation })),
      { id: currentWord.id, translation: currentWord.translation },
    ]);
  }, [currentWord, words]);

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
      <div className="quiz-container">
        <p className="empty-state">Add at least 4 words to start the quiz!</p>
      </div>
    );
  }

  if (currentIndex >= quizWords.length) {
    return (
      <div className="quiz-container">
        <div className="session-complete">
          <h2>Quiz Complete!</h2>
          <div className="session-stats">
            <span className="stat correct">{sessionStats.correct} correct</span>
            <span className="stat incorrect">{sessionStats.incorrect} incorrect</span>
          </div>
          <button className="btn btn-primary" onClick={handleRestart}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="flashcard-progress">
        {currentIndex + 1} / {quizWords.length}
      </div>

      <div className="quiz-question">
        <h3>What is the translation of:</h3>
        <div className="quiz-word-row">
          <PlayButton
            word={currentWord.word}
            audioUrl={currentWord.audioUrl}
            onAudioUrlResolved={(url) => onUpdate(currentWord.id, { audioUrl: url })}
            size="md"
          />
          <span className="quiz-word">{currentWord.word}</span>
        </div>
        {currentWord.example && (
          <p className="quiz-example">"{currentWord.example}"</p>
        )}
      </div>

      <div className="quiz-options">
        {options.map((option) => {
          let className = 'quiz-option';
          if (selected) {
            if (option.id === currentWord.id) className += ' correct';
            else if (option.id === selected) className += ' incorrect';
          }
          return (
            <button
              key={option.id}
              className={className}
              onClick={() => handleSelect(option.id)}
              disabled={!!selected}
            >
              {option.translation}
            </button>
          );
        })}
      </div>

      {selected && (
        <button className="btn btn-primary" onClick={handleNext}>
          Next
        </button>
      )}
    </div>
  );
}
