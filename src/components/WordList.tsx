import { useState, useMemo } from 'react';
import type { Word } from '../types';
import { useSpellCheck } from '../hooks/useSpellCheck';
import { SearchBar } from './SearchBar';
import { WordRow } from './WordRow';
import shared from '../styles/shared.module.css';
import s from './WordList.module.css';

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
    <div>
      <div className={s.header}>
        <h2>My Words ({words.length})</h2>
        <div className={s.actions}>
          <button className={shared.btnSecondary} onClick={onExport}>
            Export
          </button>
          <label className={`${shared.btnSecondary} ${s.importBtn}`}>
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

      <div className={s.filters}>
        <SearchBar
          value={search}
          onChange={setSearch}
          onSubmitEmpty={() => {
            if (filtered.length === 0) onNavigateToAdd(search.trim());
          }}
          spell={spell}
        />
        <button
          className={showFavoritesOnly ? s.favFilterActive : s.favFilter}
          onClick={() => setShowFavoritesOnly((v) => !v)}
          title="Show favorites only"
        >
          {showFavoritesOnly ? '\u2605' : '\u2606'}
        </button>
        {allTags.length > 0 && (
          <select
            className={`${shared.input} ${s.select}`}
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
          >
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
        <div className={shared.emptyState}>
          <p>{words.length === 0 ? 'No words yet. Add your first word!' : 'No words match your search.'}</p>
          {search.trim() && spell.invalid && spell.suggestions.length > 0 && (
            <div className={shared.spellError} style={{ marginBottom: 12 }}>
              <span>Word not found in dictionary.</span>
              <div className={shared.spellSuggestions}>
                Did you mean:{' '}
                {spell.suggestions.map((s, i) => (
                  <button
                    key={s}
                    className={shared.spellSuggestion}
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
              className={shared.btnPrimary}
              onClick={() => onNavigateToAdd(search.trim())}
            >
              Add "{search.trim()}"
            </button>
          )}
        </div>
      ) : (
        <div className={s.table}>
          {filtered.map((word) => (
            <WordRow
              key={word.id}
              word={word}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
