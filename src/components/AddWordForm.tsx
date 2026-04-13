import { useState, useMemo, useEffect, useRef } from 'react';
import type { Word } from '../types';
import type { NewWordInput } from '../hooks/useWords';
import { useSpellCheck } from '../hooks/useSpellCheck';
import { translateToUkrainian } from '../utils/translate';
import { findImage } from '../utils/image-search';
import shared from '../styles/shared.module.css';
import s from './AddWordForm.module.css';

interface Props {
  words: Word[];
  initialWord?: string;
  onAdd: (word: NewWordInput) => void;
}

export function AddWordForm({ words, initialWord = '', onAdd }: Props) {
  const [word, setWord] = useState(initialWord);
  const [translation, setTranslation] = useState('');
  const [example, setExample] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const shouldAutoFetch = initialWord.trim() && !words.some((w) => w.word.toLowerCase() === initialWord.trim().toLowerCase());
  const [translating, setTranslating] = useState(!!shouldAutoFetch);
  const [loadingImage, setLoadingImage] = useState(!!shouldAutoFetch);
  const mountedRef = useRef(true);
  const spell = useSpellCheck();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const existingWord = useMemo(() => {
    const trimmed = word.trim().toLowerCase();
    if (!trimmed) return null;
    return words.find((w) => w.word.toLowerCase() === trimmed) ?? null;
  }, [word, words]);

  const fetchTranslation = (text: string) => {
    setTranslating(true);
    translateToUkrainian(text).then((result) => {
      if (!mountedRef.current) return;
      if (result) setTranslation(result);
      setTranslating(false);
    });
  };

  const fetchImage = (text: string) => {
    setLoadingImage(true);
    findImage(text).then((url) => {
      if (!mountedRef.current) return;
      setImageUrl(url);
      setLoadingImage(false);
    });
  };

  useEffect(() => {
    if (shouldAutoFetch) {
      const trimmed = initialWord.trim();
      // State already initialized as loading — only fire async fetches
      translateToUkrainian(trimmed).then((result) => {
        if (!mountedRef.current) return;
        if (result) setTranslation(result);
        setTranslating(false);
      });
      findImage(trimmed).then((url) => {
        if (!mountedRef.current) return;
        setImageUrl(url);
        setLoadingImage(false);
      });
      spell.check(trimmed);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced auto-fetch: after user stops typing, fetch translation & image
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const debouncedFetchWordData = (text: string) => {
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    const trimmed = text.trim();
    if (!trimmed) return;
    fetchTimerRef.current = setTimeout(() => {
      if (words.some((w) => w.word.toLowerCase() === trimmed.toLowerCase())) return;
      fetchTranslation(trimmed);
      fetchImage(trimmed);
    }, 1200);
  };

  useEffect(() => {
    return () => { if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current); };
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    setWord(suggestion);
    spell.check(suggestion);
    setTranslation('');
    setImageUrl(null);
    fetchTranslation(suggestion);
    fetchImage(suggestion);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !translation.trim() || existingWord) return;

    onAdd({
      word: word.trim(),
      translation: translation.trim(),
      example: example.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      imageUrl,
    });

    setWord('');
    setTranslation('');
    setExample('');
    setTags('');
    setImageUrl(null);
  };

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <h2>Add New Word</h2>
      <div className={s.formGroup}>
        <label htmlFor="word">Word *</label>
        <div className={shared.inputWithStatus}>
          <input
            id="word"
            type="text"
            className={`${shared.input} ${s.formGroupInput}`}
            value={word}
            onChange={(e) => { setWord(e.target.value); spell.check(e.target.value); debouncedFetchWordData(e.target.value); }}
            placeholder="e.g. serendipity"
            required
          />
          {spell.checking && <span className={shared.inputStatus}>...</span>}
          {spell.valid && <span className={shared.inputStatusValid}>{'\u2713'}</span>}
          {spell.invalid && <span className={shared.inputStatusInvalid}>{'\u2717'}</span>}
        </div>
        {spell.invalid && (
          <div className={shared.spellError}>
            <span>Word not found in dictionary.</span>
            {spell.suggestions.length > 0 && (
              <div className={shared.spellSuggestions}>
                Did you mean:{' '}
                {spell.suggestions.map((sug, i) => (
                  <button
                    key={sug}
                    type="button"
                    className={shared.spellSuggestion}
                    onClick={() => handleSuggestionClick(sug)}
                  >
                    {sug}{i < spell.suggestions.length - 1 ? ',' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {existingWord ? (
        <div className={s.existingNotice}>
          <div className={s.existingLabel}>Already in your vocabulary</div>
          <div className={s.existingCard}>
            {existingWord.imageUrl && (
              <img src={existingWord.imageUrl} alt={existingWord.word} className={shared.wordImage} />
            )}
            <strong className={s.existingCardText}>{existingWord.word}</strong>
            <p className={s.existingCardTranslation}>{existingWord.translation}</p>
            {existingWord.example && (
              <p className={s.existingCardExample}>"{existingWord.example}"</p>
            )}
            {existingWord.tags.length > 0 && (
              <div className={shared.wordTags}>
                {existingWord.tags.map((tag) => (
                  <span key={tag} className={shared.tag}>{tag}</span>
                ))}
              </div>
            )}
            <div className={`${shared.wordStats} ${s.existingCardStats}`}>
              <span className={shared.statCorrect}>{existingWord.correctCount}</span>
              <span className={shared.statIncorrect}>{existingWord.incorrectCount}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {imageUrl && (
            <div className={s.imagePreview}>
              <div className={s.imagePreviewWrapper}>
                <img src={imageUrl} alt={word} className={s.previewImage} />
                <button
                  type="button"
                  className={s.removeImage}
                  onClick={() => setImageUrl(null)}
                  title="Remove image"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
          <div className={s.formGroup}>
            <label htmlFor="imageUrl">Image URL</label>
            <div className={shared.inputWithStatus}>
              <input
                id="imageUrl"
                type="url"
                className={`${shared.input} ${s.formGroupInput}`}
                value={imageUrl ?? ''}
                onChange={(e) => setImageUrl(e.target.value || null)}
                placeholder={loadingImage ? 'Searching...' : 'Paste image URL or leave for auto-search'}
              />
              {loadingImage && <span className={shared.inputStatus}>...</span>}
            </div>
          </div>
          <div className={s.formGroup}>
            <label htmlFor="translation">Translation *</label>
            <div className={shared.inputWithStatus}>
              <input
                id="translation"
                type="text"
                className={`${shared.input} ${s.formGroupInput}`}
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder={translating ? 'Translating...' : 'e.g. щасливий випадок'}
                required
              />
              {translating && <span className={shared.inputStatus}>...</span>}
            </div>
          </div>
          <div className={s.formGroup}>
            <label htmlFor="example">Example sentence</label>
            <input
              id="example"
              type="text"
              className={`${shared.input} ${s.formGroupInput}`}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="e.g. Finding that book was pure serendipity."
            />
          </div>
          <div className={s.formGroup}>
            <label htmlFor="tags">Tags (comma-separated)</label>
            <input
              id="tags"
              type="text"
              className={`${shared.input} ${s.formGroupInput}`}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. noun, advanced, literature"
            />
          </div>
          <button type="submit" className={shared.btnPrimary}>Add Word</button>
        </>
      )}
    </form>
  );
}
