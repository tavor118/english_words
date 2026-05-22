const translateCache = new Map<string, string>();

const isUseful = (translated: string | undefined | null, source: string): translated is string =>
  !!translated && translated.toLowerCase() !== source.toLowerCase();

async function fromLingva(text: string): Promise<string | null> {
  try {
    const res = await fetch(`https://lingva.ml/api/v1/en/uk/${encodeURIComponent(text)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return isUseful(data?.translation, text) ? data.translation : null;
  } catch {
    return null;
  }
}

async function fromGoogle(text: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=uk&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    // Response shape: [[["translated","source",...], ...], ...]
    const segments = data?.[0];
    if (!Array.isArray(segments)) return null;
    const joined = segments.map((s: unknown[]) => (typeof s?.[0] === 'string' ? s[0] : '')).join('').trim();
    return isUseful(joined, text) ? joined : null;
  } catch {
    return null;
  }
}

async function fromMyMemory(text: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|uk`);
    if (!res.ok) return null;
    const data = await res.json();

    const main = data.responseData?.translatedText;
    if (isUseful(main, text)) return main;

    const matches = data.matches as Array<{ translation: string; match: number }> | undefined;
    if (matches) {
      for (const m of matches) {
        if (isUseful(m.translation, text)) return m.translation;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function translateToUkrainian(text: string): Promise<string | null> {
  const key = text.toLowerCase();
  const cached = translateCache.get(key);
  if (cached) return cached;

  const translated = (await fromLingva(text)) ?? (await fromGoogle(text)) ?? (await fromMyMemory(text));
  if (translated) translateCache.set(key, translated);
  return translated;
}
