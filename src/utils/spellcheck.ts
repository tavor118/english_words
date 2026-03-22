export interface SpellCheckResult {
  valid: boolean;
  suggestions: string[];
}

export async function checkWord(word: string): Promise<SpellCheckResult> {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
    );

    if (res.ok) {
      return { valid: true, suggestions: [] };
    }

    // Word not found — get suggestions via Datamuse "sounds like"
    const sugRes = await fetch(
      `https://api.datamuse.com/words?sl=${encodeURIComponent(word.toLowerCase())}&max=8`
    );
    if (sugRes.ok) {
      const data = await sugRes.json();
      const suggestions = (data as Array<{ word: string }>)
        .map((d) => d.word)
        .filter((w) => w.toLowerCase() !== word.toLowerCase())
        .slice(0, 5);
      return { valid: false, suggestions };
    }

    return { valid: false, suggestions: [] };
  } catch {
    return { valid: true, suggestions: [] };
  }
}
