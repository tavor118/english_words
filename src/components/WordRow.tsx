import type { Word } from '../types';
import { PlayButton } from './PlayButton';
import shared from '../styles/shared.module.css';
import s from './WordRow.module.css';

interface Props {
  word: Word;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Word>) => void;
}

export function WordRow({ word, onDelete, onUpdate }: Props) {
  return (
    <div className={s.row}>
      {word.imageUrl ? (
        <img src={word.imageUrl} alt={word.word} className={s.image} />
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
            {word.favorite ? '\u2605' : '\u2606'}
          </button>
          <PlayButton
            word={word.word}
            audioUrl={word.audioUrl}
            onAudioUrlResolved={(url) => onUpdate(word.id, { audioUrl: url })}
          />
          <strong className={shared.wordText}>{word.word}</strong>
          <span className={s.sep}>—</span>
          <span className={shared.wordTranslation}>{word.translation}</span>
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
          <div className={s.right}>
            <span className={shared.statCorrect}>{word.correctCount}</span>
            <span className={shared.statIncorrect}>{word.incorrectCount}</span>
            <button
              className={shared.btnDelete}
              onClick={() => onDelete(word.id)}
              title="Delete word"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
