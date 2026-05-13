const audioCache = new Map<string, string>();

export async function getAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  const cached = audioCache.get(key);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();

    for (const entry of data) {
      for (const phonetic of entry.phonetics ?? []) {
        if (phonetic.audio) {
          audioCache.set(key, phonetic.audio);
          return phonetic.audio;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
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
