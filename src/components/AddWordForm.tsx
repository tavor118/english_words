import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Word } from '../types';
import { translateToUkrainian } from '../utils/translate';
import { findImage } from '../utils/image-search';
import { checkWord } from '../utils/spellcheck';

interface Props {
  words: Word[];
  initialWord?: string;
  onAdd: (word: { word: string; translation: string; example: string; tags: string[]; imageUrl?: string | null }) => void;
}

export function AddWordForm({ words, initialWord = '', onAdd }: Props) {
  const [word, setWord] = useState(initialWord);
  const [translation, setTranslation] = useState('');
  const [example, setExample] = useState('');
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [spellError, setSpellError] = useState<string[] | null>(null);
  const [spellValid, setSpellValid] = useState(false);
  const [checking, setChecking] = useState(false);
  const mountedRef = useRef(true);
  const spellTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (spellTimerRef.current) clearTimeout(spellTimerRef.current);
    };
  }, []);

  const existingWord = useMemo(() => {
    if (!word.trim()) return null;
    return words.find(
      (w) => w.word.toLowerCase() === word.trim().toLowerCase()
    ) ?? null;
  }, [word, words]);

  const debouncedSpellCheck = useCallback((text: string) => {
    if (spellTimerRef.current) clearTimeout(spellTimerRef.current);
    if (!text.trim()) {
      setChecking(false);
      setSpellError(null);
      setSpellValid(false);
      return;
    }
    setChecking(true);
    setSpellError(null);
    setSpellValid(false);
    spellTimerRef.current = setTimeout(() => {
      checkWord(text.trim()).then((result) => {
        if (!mountedRef.current) return;
        setChecking(false);
        if (result.valid) {
          setSpellValid(true);
        } else {
          setSpellError(result.suggestions);
        }
      });
    }, 500);
  }, []);

  const fetchWordData = (text: string) => {
    setTranslating(true);
    setLoadingImage(true);

    translateToUkrainian(text).then((result) => {
      if (!mountedRef.current) return;
      if (result) setTranslation(result);
      setTranslating(false);
    });

    findImage(text).then((url) => {
      if (!mountedRef.current) return;
      setImageUrl(url);
      setLoadingImage(false);
    });
  };

  useEffect(() => {
    if (initialWord.trim() && !existingWord) {
      fetchWordData(initialWord.trim());
      debouncedSpellCheck(initialWord.trim());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWordBlur = () => {
    if (!word.trim() || existingWord) return;

    if (!translation) {
      setTranslating(true);
      translateToUkrainian(word.trim()).then((result) => {
        if (!mountedRef.current) return;
        if (result) setTranslation(result);
        setTranslating(false);
      });
    }
    if (!imageUrl) {
      setLoadingImage(true);
      findImage(word.trim()).then((url) => {
        if (!mountedRef.current) return;
        setImageUrl(url);
        setLoadingImage(false);
      });
    }
  };

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
      imageUrl,
    });

    setWord('');
    setTranslation('');
    setExample('');
    setTags('');
    setImageUrl(null);
  };

  return (
    <form className="add-word-form" onSubmit={handleSubmit}>
      <h2>Add New Word</h2>
      <div className="form-group">
        <label htmlFor="word">Word *</label>
        <div className="input-with-status">
          <input
            id="word"
            type="text"
            value={word}
            onChange={(e) => { setWord(e.target.value); debouncedSpellCheck(e.target.value); }}
            onBlur={handleWordBlur}
            placeholder="e.g. serendipity"
            required
          />
          {checking && <span className="input-status">...</span>}
          {spellValid && <span className="input-status valid">{'\u2713'}</span>}
          {spellError !== null && <span className="input-status invalid">{'\u2717'}</span>}
        </div>
        {spellError !== null && (
          <div className="spell-error">
            <span>Word not found in dictionary.</span>
            {spellError.length > 0 && (
              <div className="spell-suggestions">
                Did you mean:{' '}
                {spellError.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    className="spell-suggestion"
                    onClick={() => {
                      setWord(s);
                      setSpellError(null);
                      setTranslation('');
                      setImageUrl(null);
                    }}
                  >
                    {s}{i < spellError.length - 1 ? ',' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {existingWord ? (
        <div className="existing-word-notice">
          <div className="existing-word-label">Already in your vocabulary</div>
          <div className="existing-word-card">
            {existingWord.imageUrl && (
              <img src={existingWord.imageUrl} alt={existingWord.word} className="word-image" />
            )}
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
          {imageUrl && (
            <div className="form-image-preview">
              <div className="image-preview-wrapper">
                <img src={imageUrl} alt={word} className="word-image-preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={() => setImageUrl(null)}
                  title="Remove image"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <div className="input-with-status">
              <input
                id="imageUrl"
                type="url"
                value={imageUrl ?? ''}
                onChange={(e) => setImageUrl(e.target.value || null)}
                placeholder={loadingImage ? 'Searching...' : 'Paste image URL or leave for auto-search'}
              />
              {loadingImage && <span className="input-status">...</span>}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="translation">Translation *</label>
            <div className="input-with-status">
              <input
                id="translation"
                type="text"
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                placeholder={translating ? 'Translating...' : 'e.g. щасливий випадок'}
                required
              />
              {translating && <span className="input-status">...</span>}
            </div>
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
