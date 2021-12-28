const cache = caches.default as Cache;

function createCacheRequest(key: string): Request {
  return new Request(`http://remix.guide/__cache/${key}`, {
    method: 'GET',
  });
}

export async function matchCache<T>(key: string): T | null {
  const cacheRequest = createCacheRequest(key);
  const response = await cache.match(cacheRequest);

  if (!response || !response.ok) {
    return null;
  }

  return await response.json();
}

export async function updateCache<T>(
  key: string,
  data: T,
  maxAge: number
): Promise<void> {
  const cacheRequest = createCacheRequest(key);
  const cacheResponse = new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Cache-Control': `public, max-age=${maxAge}`,
    },
  });

  await cache.put(cacheRequest, cacheResponse);
}

export async function removeCache(key: string): Pormise<void> {
  const cacheRequest = createCacheRequest(key);

  await cache.delete(cacheRequest);
}
