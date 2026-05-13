import { useState, useEffect } from 'react';
import type { Word } from '../types';
import { EXERCISE_KEYS, EXERCISE_LABELS } from '../types';
import { isLearned, countPassed, resetProgress, markAllLearned } from '../utils/exercise-progress';
import { PlayButton } from './PlayButton';
import shared from '../styles/shared.module.css';
import s from './WordRow.module.css';

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const EditIcon = () => (
  <svg {...iconProps}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg {...iconProps} strokeWidth={4}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RotateIcon = () => (
  <svg {...iconProps}>
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const TrashIcon = () => (
  <svg {...iconProps}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

interface Props {
  word: Word;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Word>) => void;
}

export function WordRow({ word, onDelete, onUpdate }: Props) {
  const learned = isLearned(word);
  const passed = countPassed(word);
  const [editing, setEditing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [draftImgError, setDraftImgError] = useState(false);
  const [draft, setDraft] = useState({
    word: word.word,
    translation: word.translation,
    example: word.example,
    tags: word.tags.join(', '),
    imageUrl: word.imageUrl ?? '',
  });

  useEffect(() => { setImgError(false); }, [word.imageUrl]);
  useEffect(() => { setDraftImgError(false); }, [draft.imageUrl]);

  const startEdit = () => {
    setDraft({
      word: word.word,
      translation: word.translation,
      example: word.example,
      tags: word.tags.join(', '),
      imageUrl: word.imageUrl ?? '',
    });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = () => {
    const trimmedWord = draft.word.trim();
    const trimmedTranslation = draft.translation.trim();
    if (!trimmedWord || !trimmedTranslation) return;
    onUpdate(word.id, {
      word: trimmedWord,
      translation: trimmedTranslation,
      example: draft.example.trim(),
      tags: draft.tags.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl: draft.imageUrl.trim() || null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={s.row}>
        {draft.imageUrl && !draftImgError ? (
          <img
            src={draft.imageUrl}
            alt={draft.word}
            className={s.image}
            onError={() => setDraftImgError(true)}
          />
        ) : (
          <div className={s.imagePlaceholder}>{(draft.word || '?').charAt(0).toUpperCase()}</div>
        )}
        <form
          className={s.editForm}
          onSubmit={(e) => { e.preventDefault(); saveEdit(); }}
        >
          <div className={s.editRow}>
            <input
              className={`${shared.input} ${s.editInput}`}
              value={draft.word}
              onChange={(e) => setDraft({ ...draft, word: e.target.value })}
              placeholder="Word"
              aria-label="Word"
              required
              autoFocus
            />
            <input
              className={`${shared.input} ${s.editInput}`}
              value={draft.translation}
              onChange={(e) => setDraft({ ...draft, translation: e.target.value })}
              placeholder="Translation"
              aria-label="Translation"
              required
            />
          </div>
          <input
            className={`${shared.input} ${s.editInput}`}
            value={draft.example}
            onChange={(e) => setDraft({ ...draft, example: e.target.value })}
            placeholder="Example sentence"
            aria-label="Example"
          />
          <div className={s.editRow}>
            <input
              className={`${shared.input} ${s.editInput}`}
              value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              placeholder="Tags (comma-separated)"
              aria-label="Tags"
            />
            <input
              className={`${shared.input} ${s.editInput}`}
              value={draft.imageUrl}
              onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
              placeholder="Image URL"
              aria-label="Image URL"
            />
          </div>
          <div className={s.editActions}>
            <button type="submit" className={shared.btnPrimary}>Save</button>
            <button type="button" className={shared.btnSecondary} onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`${s.row} ${learned ? s.rowLearned : ''}`}>
      {word.imageUrl && !imgError ? (
        <img
          src={word.imageUrl}
          alt={word.word}
          className={s.image}
          onError={() => {
            setImgError(true);
            onUpdate(word.id, { imageUrl: null });
          }}
        />
      ) : (
        <div className={s.imagePlaceholder}>{word.word.charAt(0).toUpperCase()}</div>
      )}
      <div className={s.content}>
        <div className={s.main}>
          <button
            className={word.favorite ? shared.btnFavActive : shared.btnFav}
            onClick={() => onUpdate(word.id, { favorite: !word.favorite })}
            title={word.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {word.favorite ? '★' : '☆'}
          </button>
          <PlayButton
            word={word.word}
            audioUrl={word.audioUrl}
            onAudioUrlResolved={(url) => onUpdate(word.id, { audioUrl: url })}
          />
          <strong className={shared.wordText}>{word.word}</strong>
          <span className={s.sep}>—</span>
          <span className={shared.wordTranslation}>{word.translation}</span>
          {learned && <span className={s.learnedBadge}>Learned</span>}
        </div>
        <div className={s.meta}>
          {word.example && <span className={shared.wordExample}>"{word.example}"</span>}
          {word.tags.length > 0 && (
            <div className={shared.wordTags}>
              {word.tags.map((tag) => (
                <span key={tag} className={shared.tag}>{tag}</span>
              ))}
            </div>
          )}
          <div className={s.progress} title={`${passed} of ${EXERCISE_KEYS.length} exercises passed`}>
            {EXERCISE_KEYS.map((key) => (
              <span
                key={key}
                className={word.progress[key] ? s.dotOn : s.dotOff}
                title={`${EXERCISE_LABELS[key]}: ${word.progress[key] ? 'passed' : 'not passed yet'}`}
              />
            ))}
            <span className={s.progressCount}>{passed}/{EXERCISE_KEYS.length}</span>
          </div>
          <div className={s.right}>
            <span className={shared.statCorrect}>{word.correctCount}</span>
            <span className={shared.statIncorrect}>{word.incorrectCount}</span>
            <div className={s.actions}>
              <button
                className={s.iconBtnEdit}
                onClick={startEdit}
                aria-label="Edit"
              >
                <EditIcon />
              </button>
              {learned ? (
                <button
                  className={s.iconBtnReset}
                  onClick={() => onUpdate(word.id, resetProgress())}
                  aria-label="Reset"
                >
                  <RotateIcon />
                </button>
              ) : (
                <button
                  className={s.iconBtnLearn}
                  onClick={() => onUpdate(word.id, markAllLearned())}
                  aria-label="Mark learned"
                >
                  <CheckIcon />
                </button>
              )}
              <button
                className={s.iconBtnDanger}
                onClick={() => onDelete(word.id)}
                aria-label="Delete"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}