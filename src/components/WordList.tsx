import { useState } from 'react';
import type { Word } from '../types';

interface Props {
  words: Word[];
  onDelete: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onNavigateToAdd: (word: string) => void;
}

export function WordList({ words, onDelete, onExport, onImport, onNavigateToAdd }: Props) {
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const allTags = [...new Set(words.flatMap((w) => w.tags))].sort();

  const filtered = words.filter((w) => {
    const matchesSearch =
      !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || w.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="word-list">
      <div className="word-list-header">
        <h2>My Words ({words.length})</h2>
        <div className="word-list-actions">
          <button className="btn btn-secondary" onClick={onExport}>
            Export
          </button>
          <label className="btn btn-secondary import-btn">
            Import
            <input
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
              hidden
            />
          </label>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search words..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {allTags.length > 0 && (
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          {words.length === 0 ? (
            <p>No words yet. Add your first word!</p>
          ) : (
            <>
              <p>No words match your search.</p>
              {search.trim() && (
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={() => onNavigateToAdd(search.trim())}
                >
                  Add "{search.trim()}"
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="words-grid">
          {filtered.map((word) => (
            <div key={word.id} className="word-card">
              <div className="word-card-header">
                <strong className="word-text">{word.word}</strong>
                <button
                  className="btn-delete"
                  onClick={() => onDelete(word.id)}
                  title="Delete word"
                >
                  &times;
                </button>
              </div>
              <p className="word-translation">{word.translation}</p>
              {word.example && <p className="word-example">"{word.example}"</p>}
              {word.tags.length > 0 && (
                <div className="word-tags">
                  {word.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="word-stats">
                <span className="stat correct">{word.correctCount}</span>
                <span className="stat incorrect">{word.incorrectCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
