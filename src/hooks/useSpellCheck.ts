import { useState, useEffect, useRef, useCallback } from 'react';
import { checkWord } from '../utils/spellcheck';

interface SpellCheckState {
  checking: boolean;
  valid: boolean;
  invalid: boolean;
  suggestions: string[];
}

export function useSpellCheck() {
  const [state, setState] = useState<SpellCheckState>({
    checking: false,
    valid: false,
    invalid: false,
    suggestions: [],
  });
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const check = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!text.trim()) {
      setState({ checking: false, valid: false, invalid: false, suggestions: [] });
      return;
    }

    setState({ checking: true, valid: false, invalid: false, suggestions: [] });

    timerRef.current = setTimeout(() => {
      checkWord(text.trim()).then((result) => {
        if (!mountedRef.current) return;
        if (result.valid) {
          setState({ checking: false, valid: true, invalid: false, suggestions: [] });
        } else {
          setState({ checking: false, valid: false, invalid: true, suggestions: result.suggestions });
        }
      });
    }, 500);
  }, []);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setState({ checking: false, valid: false, invalid: false, suggestions: [] });
  }, []);

  return { ...state, check, reset };
}
