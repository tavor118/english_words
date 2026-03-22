export async function translateToUkrainian(text: string): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|uk`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const main = data.responseData?.translatedText;
    if (main && main.toLowerCase() !== text.toLowerCase()) {
      return main;
    }

    // Fallback: look through matches for a real translation
    const matches = data.matches as Array<{ translation: string; match: number }> | undefined;
    if (matches) {
      for (const m of matches) {
        if (m.translation && m.translation.toLowerCase() !== text.toLowerCase()) {
          return m.translation;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
