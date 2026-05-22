const UPSTREAM = 'https://api.langeek.co';
const ALLOWED_PREFIX = '/v1/';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, _env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith(ALLOWED_PREFIX)) {
      return new Response('Not found', { status: 404, headers: CORS });
    }

    const upstreamUrl = UPSTREAM + url.pathname + url.search;
    const cacheKey = new Request(upstreamUrl, { method: 'GET' });
    const cache = caches.default;

    let response = await cache.match(cacheKey);
    if (!response) {
      const upstream = await fetch(upstreamUrl, {
        headers: { Accept: 'application/json' },
      });
      response = new Response(upstream.body, upstream);
      response.headers.set('Cache-Control', 'public, max-age=86400');
      response.headers.delete('Set-Cookie');
      if (upstream.ok) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    }

    const body = request.method === 'HEAD' ? null : response.body;
    const final = new Response(body, response);
    for (const [k, v] of Object.entries(CORS)) final.headers.set(k, v);
    return final;
  },
};
