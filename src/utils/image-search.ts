export async function findImage(query: string): Promise<string | null> {
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

    // Prefer pages whose title closely matches the query
    const queryLower = query.toLowerCase();
    const withImages = entries.filter((p) => p.thumbnail?.source);

    // Exact title match first
    const exact = withImages.find((p) => p.title.toLowerCase() === queryLower);
    if (exact) return exact.thumbnail!.source;

    // Title starts with query
    const startsWith = withImages.find((p) =>
      p.title.toLowerCase().startsWith(queryLower)
    );
    if (startsWith) return startsWith.thumbnail!.source;

    // Title contains query
    const contains = withImages.find((p) =>
      p.title.toLowerCase().includes(queryLower)
    );
    if (contains) return contains.thumbnail!.source;

    // Fallback to first result with image
    if (withImages.length > 0) return withImages[0].thumbnail!.source;

    return null;
  } catch {
    return null;
  }
}
