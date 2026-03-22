let audioCache: Record<string, string> = {};

export async function getAudioUrl(word: string): Promise<string | null> {
  const key = word.toLowerCase();
  if (audioCache[key]) return audioCache[key];

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();

    for (const entry of data) {
      for (const phonetic of entry.phonetics ?? []) {
        if (phonetic.audio) {
          audioCache[key] = phonetic.audio;
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
  const audio = new Audio(url);
  audio.play();
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
