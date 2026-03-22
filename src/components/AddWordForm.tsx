import { useState, useMemo } from 'react';
import type { Word } from '../types';

interface Props {
  words: Word[];
  initialWord?: string;
  onAdd: (word: { word: string; translation: string; example: string; tags: string[] }) => void;
}

export function AddWordForm({ words, initialWord = '', onAdd }: Props) {
  const [word, setWord] = useState(initialWord);
  const [translation, setTranslation] = useState('');
  const [example, setExample] = useState('');
  const [tags, setTags] = useState('');

  const existingWord = useMemo(() => {
    if (!word.trim()) return null;
    return words.find(
      (w) => w.word.toLowerCase() === word.trim().toLowerCase()
    ) ?? null;
  }, [word, words]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim() || existingWord) return;

    onAdd({
      word: word.trim(),
      translation: translation.trim(),
      example: example.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });

    setWord('');
    setTranslation('');
    setExample('');
    setTags('');
  };

  return (
    <form className="add-word-form" onSubmit={handleSubmit}>
      <h2>Add New Word</h2>
      <div className="form-group">
        <label htmlFor="word">Word *</label>
        <input
          id="word"
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="e.g. serendipity"
          required
        />
      </div>

      {existingWord ? (
        <div className="existing-word-notice">
          <div className="existing-word-label">Already in your vocabulary</div>
          <div className="existing-word-card">
            <strong className="word-text">{existingWord.word}</strong>
            <p className="word-translation">{existingWord.translation}</p>
            {existingWord.example && (
              <p className="word-example">"{existingWord.example}"</p>
            )}
            {existingWord.tags.length > 0 && (
              <div className="word-tags">
                {existingWord.tags.map((tag) => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="word-stats">
              <span className="stat correct">{existingWord.correctCount}</span>
              <span className="stat incorrect">{existingWord.incorrectCount}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label htmlFor="translation">Translation *</label>
            <input
              id="translation"
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="e.g. a happy accident"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="example">Example sentence</label>
            <input
              id="example"
              type="text"
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="e.g. Finding that book was pure serendipity."
            />
          </div>
          <div className="form-group">
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. noun, advanced, literature"
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Word</button>
        </>
      )}
    </form>
  );
}
