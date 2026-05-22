import { describe, it, expect, vi, beforeEach } from 'vitest';

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

describe('translateToUkrainian', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns Lingva translation on success', async () => {
    mockFetch((url) => {
      if (url.startsWith('https://lingva.ml')) return okJson({ translation: 'привіт' });
      throw new Error(`unexpected call to ${url}`);
    });
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('hello')).toBe('привіт');
  });

  it('falls back to Google when Lingva fails', async () => {
    mockFetch((url) => {
      if (url.startsWith('https://lingva.ml')) return fail();
      if (url.startsWith('https://translate.googleapis.com')) {
        return okJson([[['яблуко', 'apple', null, null, 3]]]);
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('apple')).toBe('яблуко');
  });

  it('joins multi-segment Google responses', async () => {
    mockFetch((url) => {
      if (url.startsWith('https://lingva.ml')) return fail();
      if (url.startsWith('https://translate.googleapis.com')) {
        return okJson([
          [
            ['добрий ', 'good ', null, null, 0],
            ['ранок', 'morning', null, null, 0],
          ],
        ]);
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('good morning')).toBe('добрий ранок');
  });

  it('falls back to MyMemory when Lingva and Google fail', async () => {
    mockFetch((url) => {
      if (url.startsWith('https://lingva.ml')) return fail();
      if (url.startsWith('https://translate.googleapis.com')) return fail();
      if (url.startsWith('https://api.mymemory.translated.net')) {
        return okJson({ responseData: { translatedText: 'собака' } });
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('dog')).toBe('собака');
  });

  it('uses MyMemory matches[] when responseData echoes the source', async () => {
    mockFetch((url) => {
      if (url.startsWith('https://lingva.ml')) return fail();
      if (url.startsWith('https://translate.googleapis.com')) return fail();
      if (url.startsWith('https://api.mymemory.translated.net')) {
        return okJson({
          responseData: { translatedText: 'cat' },
          matches: [
            { translation: 'cat', match: 0.5 },
            { translation: 'кіт', match: 0.9 },
          ],
        });
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('cat')).toBe('кіт');
  });

  it('returns null when every provider fails', async () => {
    mockFetch(() => fail());
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('zzz')).toBeNull();
  });

  it('rejects echo translations (provider returns the source word)', async () => {
    mockFetch((url) => {
      if (url.startsWith('https://lingva.ml')) return okJson({ translation: 'Hello' });
      if (url.startsWith('https://translate.googleapis.com')) {
        return okJson([[['привіт', 'hello']]]);
      }
      throw new Error(`unexpected call to ${url}`);
    });
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('hello')).toBe('привіт');
  });

  it('caches successful translations across calls', async () => {
    const spy = mockFetch((url) => {
      if (url.startsWith('https://lingva.ml')) return okJson({ translation: 'книга' });
      throw new Error(`unexpected call to ${url}`);
    });
    const { translateToUkrainian } = await import('../utils/translate');
    expect(await translateToUkrainian('book')).toBe('книга');
    expect(await translateToUkrainian('book')).toBe('книга');
    expect(await translateToUkrainian('BOOK')).toBe('книга');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
