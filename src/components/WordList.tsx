import { useState, useRef, useCallback, useEffect } from 'react';
import type { Word } from '../types';
import { PlayButton } from './PlayButton';
import { checkWord } from '../utils/spellcheck';

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
  const [spellSuggestions, setSpellSuggestions] = useState<string[]>([]);
  const [spellValid, setSpellValid] = useState(false);
  const [spellInvalid, setSpellInvalid] = useState(false);
  const [spellChecking, setSpellChecking] = useState(false);
  const spellTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => { if (spellTimerRef.current) clearTimeout(spellTimerRef.current); };
  }, []);

  const debouncedSpellCheck = useCallback((text: string) => {
    if (spellTimerRef.current) clearTimeout(spellTimerRef.current);
    setSpellValid(false);
    setSpellInvalid(false);
    setSpellSuggestions([]);
    if (!text.trim()) {
      setSpellChecking(false);
      return;
    }
    setSpellChecking(true);
    spellTimerRef.current = setTimeout(() => {
      checkWord(text.trim()).then((result) => {
        setSpellChecking(false);
        if (result.valid) {
          setSpellValid(true);
        } else {
          setSpellInvalid(true);
          setSpellSuggestions(result.suggestions);
        }
      });
    }, 500);
  }, []);

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
        <div className="input-with-status search-input-wrapper">
          <input
            type="text"
            placeholder="Search words..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); debouncedSpellCheck(e.target.value); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim() && filtered.length === 0) {
                onNavigateToAdd(search.trim());
              }
            }}
            className="search-input"
          />
          {spellChecking && <span className="input-status">...</span>}
          {spellValid && <span className="input-status valid">{'\u2713'}</span>}
          {spellInvalid && <span className="input-status invalid">{'\u2717'}</span>}
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
          {search.trim() && spellInvalid && spellSuggestions.length > 0 && (
            <div className="spell-error" style={{ marginBottom: 12 }}>
              <span>Word not found in dictionary.</span>
              <div className="spell-suggestions">
                Did you mean:{' '}
                {spellSuggestions.map((s, i) => (
                  <button
                    key={s}
                    className="spell-suggestion"
                    onClick={() => { setSearch(s); debouncedSpellCheck(s); }}
                  >
                    {s}{i < spellSuggestions.length - 1 ? ',' : ''}
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
