import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const LANGEEK_BASE = 'https://proxy.test';

type FetchHandler = (url: string) => Partial<Response> & { ok: boolean; json: () => Promise<unknown> };

function mockFetch(handler: FetchHandler) {
  const spy = vi.fn(async (input: RequestInfo | URL) => handler(String(input)) as Response);
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

const okJson = (body: unknown) => ({ ok: true, json: async () => body }) as Partial<Response> & {
  ok: boolean;
  json: () => Promise<unknown>;
};
const fail = () => ({ ok: false, json: async () => ({}) }) as Partial<Response> & {
  ok: boolean;
  json: () => Promise<unknown>;
};

const langeekEntry = (entry: string, photo: string | null) => ({
  id: 1,
  entry,
  translation: photo ? { wordPhoto: { photo }, position: 0 } : null,
  translations: {},
});

const wikiSearchResult = (title: string, source: string) => ({
  query: { pages: { 1: { title, index: 0, thumbnail: { source } } } },
});

describe('findImage (with Langeek proxy enabled)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_LANGEEK_API', LANGEEK_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the Langeek photo for an exact entry match', async () => {
    mockFetch((url) => {
      if (url.startsWith(LANGEEK_BASE)) {
        return okJson([
          langeekEntry('apricot', 'https://cdn.langeek.co/photo/1/original/apricot?type=jpeg'),
          langeekEntry('apple', 'https://cdn.langeek.co/photo/2/original/apple?type=jpeg'),
        ]);
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { findImage } = await import('../utils/image-search');
    expect(await findImage('apple')).toBe('https://cdn.langeek.co/photo/2/original/apple?type=jpeg');
  });

  it('falls back to a non-primary sense photo when primary has none', async () => {
    mockFetch((url) => {
      if (url.startsWith(LANGEEK_BASE)) {
        return okJson([
          {
            id: 1,
            entry: 'run',
            translation: { wordPhoto: null, position: 0 },
            translations: {
              verb: [
                { wordPhoto: null, position: 0 },
                { wordPhoto: { photo: 'https://cdn.langeek.co/photo/9/original/run?type=jpeg' }, position: 1 },
              ],
            },
          },
        ]);
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { findImage } = await import('../utils/image-search');
    expect(await findImage('run')).toBe('https://cdn.langeek.co/photo/9/original/run?type=jpeg');
  });

  it('falls back to Wikipedia when Langeek has no entry with a photo', async () => {
    mockFetch((url) => {
      if (url.startsWith(LANGEEK_BASE)) {
        return okJson([langeekEntry('otherwise', null)]);
      }
      if (url.startsWith('https://en.wikipedia.org')) {
        return okJson(wikiSearchResult('Otherwise', 'https://wiki.example/otherwise.jpg'));
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { findImage } = await import('../utils/image-search');
    expect(await findImage('otherwise')).toBe('https://wiki.example/otherwise.jpg');
  });

  it('falls back to Wikipedia when Langeek request fails', async () => {
    mockFetch((url) => {
      if (url.startsWith(LANGEEK_BASE)) return fail();
      if (url.startsWith('https://en.wikipedia.org')) {
        return okJson(wikiSearchResult('Tree', 'https://wiki.example/tree.jpg'));
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { findImage } = await import('../utils/image-search');
    expect(await findImage('tree')).toBe('https://wiki.example/tree.jpg');
  });

  it('returns null when both Langeek and Wikipedia fail', async () => {
    mockFetch(() => fail());
    const { findImage } = await import('../utils/image-search');
    expect(await findImage('zzz')).toBeNull();
  });
});

describe('findImage (without Langeek proxy)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_LANGEEK_API', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips Langeek entirely and goes straight to Wikipedia', async () => {
    const spy = mockFetch((url) => {
      if (url.startsWith('https://en.wikipedia.org')) {
        return okJson(wikiSearchResult('Book', 'https://wiki.example/book.jpg'));
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { findImage } = await import('../utils/image-search');
    expect(await findImage('book')).toBe('https://wiki.example/book.jpg');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain('wikipedia.org');
  });
});
