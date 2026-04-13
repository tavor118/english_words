import { useState, useMemo } from 'react';
import type { Word } from '../types';
import { PlayButton } from './PlayButton';
import { useSpellCheck } from '../hooks/useSpellCheck';

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
  const spell = useSpellCheck();

  const allTags = useMemo(
    () => [...new Set(words.flatMap((w) => w.tags))].sort(),
    [words]
  );

  const filtered = useMemo(
    () => words.filter((w) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        w.word.toLowerCase().includes(searchLower) ||
        w.translation.toLowerCase().includes(searchLower);
      const matchesTag = !filterTag || w.tags.includes(filterTag);
      const matchesFav = !showFavoritesOnly || w.favorite;
      return matchesSearch && matchesTag && matchesFav;
    }).sort((a, b) => b.createdAt - a.createdAt),
    [words, search, filterTag, showFavoritesOnly]
  );

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
        <div className="input-with-status search-input-wrapper">
          <input
            type="text"
            placeholder="Search words..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); spell.check(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim() && filtered.length === 0) {
                onNavigateToAdd(search.trim());
              }
            }}
            className="search-input"
          />
          {spell.checking && <span className="input-status">...</span>}
          {spell.valid && <span className="input-status valid">{'\u2713'}</span>}
          {spell.invalid && <span className="input-status invalid">{'\u2717'}</span>}
        </div>
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
          {search.trim() && spell.invalid && spell.suggestions.length > 0 && (
            <div className="spell-error" style={{ marginBottom: 12 }}>
              <span>Word not found in dictionary.</span>
              <div className="spell-suggestions">
                Did you mean:{' '}
                {spell.suggestions.map((s, i) => (
                  <button
                    key={s}
                    className="spell-suggestion"
                    onClick={() => { setSearch(s); spell.check(s); }}
                  >
                    {s}{i < spell.suggestions.length - 1 ? ',' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
          {search.trim() && (
            <button
              className="btn btn-primary"
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
              {word.imageUrl ? (
                <img src={word.imageUrl} alt={word.word} className="word-row-image" />
              ) : (
                <div className="word-row-image placeholder">{word.word.charAt(0).toUpperCase()}</div>
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
                  <PlayButton
                    word={word.word}
                    audioUrl={word.audioUrl}
                    onAudioUrlResolved={(url) => onUpdate(word.id, { audioUrl: url })}
                  />
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
