const CAMBRIDGE_BASE = import.meta.env.VITE_CAMBRIDGE_API ?? '';
const audioCache = new Map<string, string>();

async function fromCambridge(key: string): Promise<string | null> {
  if (!CAMBRIDGE_BASE) return null;
  try {
    const res = await fetch(`${CAMBRIDGE_BASE}/api/dictionary/en/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const prons: Array<{ lang?: string; url?: string }> = data.pronunciation ?? [];
    const us = prons.find(p => p.lang === 'us' && p.url);
    return us?.url ?? prons.find(p => p.url)?.url ?? null;
  } catch {
    return null;
  }
}

async function fromDictionaryApiDev(key: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();

    let fallback: string | null = null;
    for (const entry of data) {
      for (const phonetic of entry.phonetics ?? []) {
        const audio: string | undefined = phonetic.audio;
        if (!audio) continue;
        if (/-us\.mp3$/i.test(audio)) return audio;
        if (!fallback && !/-uk\.mp3$/i.test(audio)) fallback = audio;
        if (!fallback) fallback = audio;
      }
    }
    return fallback;
  } catch {
    return null;
  }
}

export async function getAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  const cached = audioCache.get(key);
  if (cached) return cached;

  const url = (await fromCambridge(key)) ?? (await fromDictionaryApiDev(key));
  if (url) audioCache.set(key, url);
  return url;
}

export function playAudio(url: string): void {
  new Audio(url).play();
}

export function speakWord(word: string): void {
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

export async function pronounce(word: string): Promise<void> {
  const url = await getAudioUrl(word);
  if (url) {
    playAudio(url);
  } else {
    speakWord(word);
  }
}

export async function playWord(
  word: string,
  cachedUrl: string | null | undefined,
  onCache?: (url: string) => void
): Promise<void> {
  if (cachedUrl) {
    playAudio(cachedUrl);
    return;
  }
  const url = await getAudioUrl(word);
  if (url) {
    playAudio(url);
    onCache?.(url);
  } else {
    speakWord(word);
  }
}
