const LANGEEK_BASE = import.meta.env.VITE_LANGEEK_API ?? '';

interface LangeekPhoto {
  photo?: string;
  photoThumbnail?: string;
}

interface LangeekSense {
  wordPhoto?: LangeekPhoto | null;
}

interface LangeekEntry {
  entry?: string;
  translation?: LangeekSense | null;
  translations?: Record<string, LangeekSense[]> | null;
}

function pickPhoto(sense: LangeekSense | null | undefined): string | null {
  return sense?.wordPhoto?.photo ?? sense?.wordPhoto?.photoThumbnail ?? null;
}

async function fromLangeek(query: string): Promise<string | null> {
  if (!LANGEEK_BASE) return null;
  try {
    const res = await fetch(`${LANGEEK_BASE}/v1/cs/en/word/?term=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as LangeekEntry[];
    if (!Array.isArray(data) || data.length === 0) return null;

    const queryLower = query.toLowerCase();
    const exact = data.find((e) => e.entry?.toLowerCase() === queryLower);
    const target = exact ?? data[0];

    const primary = pickPhoto(target.translation);
    if (primary) return primary;

    const allSenses = Object.values(target.translations ?? {}).flat();
    for (const sense of allSenses) {
      const photo = pickPhoto(sense);
      if (photo) return photo;
    }
    return null;
  } catch {
    return null;
  }
}

async function fromWikipedia(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=10&prop=pageimages&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;
    const res = await fetch(searchUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const entries = Object.values(pages) as Array<{
      title: string;
      index: number;
      thumbnail?: { source: string };
    }>;

    const queryLower = query.toLowerCase();
    const withImages = entries.filter((p) => p.thumbnail?.source);

    const exact = withImages.find((p) => p.title.toLowerCase() === queryLower);
    if (exact) return exact.thumbnail!.source;

    const startsWith = withImages.find((p) =>
      p.title.toLowerCase().startsWith(queryLower)
    );
    if (startsWith) return startsWith.thumbnail!.source;

    const contains = withImages.find((p) =>
      p.title.toLowerCase().includes(queryLower)
    );
    if (contains) return contains.thumbnail!.source;

    if (withImages.length > 0) return withImages[0].thumbnail!.source;

    return null;
  } catch {
    return null;
  }
}

export async function findImage(query: string): Promise<string | null> {
  return (await fromLangeek(query)) ?? (await fromWikipedia(query));
}
