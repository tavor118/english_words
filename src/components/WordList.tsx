import { useState } from 'react';
import type { Word } from '../types';

interface Props {
  words: Word[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Word>) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onNavigateToAdd: (word: string) => void;
}

export function WordList({ words, onDelete, onUpdate, onExport, onImport, onNavigateToAdd }: Props) {
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const allTags = [...new Set(words.flatMap((w) => w.tags))].sort();

  const filtered = words.filter((w) => {
    const matchesSearch =
      !search ||
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.translation.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !filterTag || w.tags.includes(filterTag);
    const matchesFav = !showFavoritesOnly || w.favorite;
    return matchesSearch && matchesTag && matchesFav;
  }).sort((a, b) => b.createdAt - a.createdAt);

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
          onKeyDown={(e) => {
            if (e.key === 'Enter' && search.trim() && filtered.length === 0) {
              onNavigateToAdd(search.trim());
            }
          }}
          className="search-input"
        />
        <button
          className={`btn-fav-filter ${showFavoritesOnly ? 'active' : ''}`}
          onClick={() => setShowFavoritesOnly((v) => !v)}
          title="Show favorites only"
        >
          {showFavoritesOnly ? '\u2605' : '\u2606'}
        </button>
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
          <p>{words.length === 0 ? 'No words yet. Add your first word!' : 'No words match your search.'}</p>
          {search.trim() && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => onNavigateToAdd(search.trim())}
            >
              Add "{search.trim()}"
            </button>
          )}
        </div>
      ) : (
        <div className="words-table">
          {filtered.map((word) => (
            <div key={word.id} className="word-row">
              {word.imageUrl && (
                <img src={word.imageUrl} alt={word.word} className="word-row-image" />
              )}
              <div className="word-row-content">
              <div className="word-row-main">
                <button
                  className={`btn-fav ${word.favorite ? 'active' : ''}`}
                  onClick={() => onUpdate(word.id, { favorite: !word.favorite })}
                  title={word.favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {word.favorite ? '\u2605' : '\u2606'}
                </button>
                <strong className="word-text">{word.word}</strong>
                <span className="word-row-sep">—</span>
                <span className="word-translation">{word.translation}</span>
              </div>
              <div className="word-row-meta">
                {word.example && <span className="word-example">"{word.example}"</span>}
                {word.tags.length > 0 && (
                  <div className="word-tags">
                    {word.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="word-row-right">
                  <span className="stat correct">{word.correctCount}</span>
                  <span className="stat incorrect">{word.incorrectCount}</span>
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(word.id)}
                    title="Delete word"
                  >
                    Delete
                  </button>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
