import type { Query, SetupQueryFunction } from '@workaholic/core';
import { createQuery as createRawQuery } from '@workaholic/core';
import Fuse from 'fuse.js';

const keys = [
  { name: 'category', weight: 1 },
  { name: 'author', weight: 2 },
  { name: 'title', weight: 3 },
  { name: 'description', weight: 1 },
  { name: 'platforms', weight: 2 },
  { name: 'packages', weight: 1 },
];

let setupQuery: SetupQueryFunction = (ctx) => {
  function match(list, options) {
    const { categories, language, platform, author, packageName } =
      options ?? {};

    return list.filter((item) => {
      if (categories?.length > 0 && !categories.includes(item.category)) {
        return false;
      }

      if (author && item.author !== author) {
        return false;
      }

      if (language && item.language !== language) {
        return false;
      }

      if (platform && !item.platforms?.includes(platform)) {
        return false;
      }

      if (packageName && !item.packages?.includes(packageName)) {
        return false;
      }

      return true;
    });
  }

  function handleSearch(list, index, keyword) {
    if (!keyword || !index) {
      return list;
    }

    const fuse = new Fuse(
      list,
      {
        isCaseSensitive: false,
        includeScore: true,
        minMatchCharLength: 1,
        shouldSort: true,
        findAllMatches: true,
        keys,
      },
      Fuse.parseIndex(index)
    );

    return fuse.search(keyword).map((data) => data.item);
  }

  async function handleQuery(
    query: Query,
    namespace: string,
    slug: string,
    options?: Record<string, any>
  ): Promise<any> {
    switch (namespace) {
      case 'search':
        const [list, index] = await Promise.all([
          query(namespace, 'list', { type: 'json' }),
          query(namespace, 'index', { type: 'json' }),
        ]);

        if (!list) {
          return [];
        }

        const data = handleSearch(list, index, slug);
        const result = match(data, options);

        return result;
      default:
        return await query(namespace, slug, { type: 'json' });
    }
  }

  return (query) =>
    async (namespace: string, slug: string, options?: Record<string, any>) => {
      let cache = await caches.open(namespace);
      let queryEntries = Object.entries(options ?? {}).filter(
        ([key, value]) =>
          typeof value !== 'undefined' && value !== '' && value !== null
      );
      let searchParams = new URLSearchParams(queryEntries);
      let request = new Request(
        `http://${namespace}/${slug}?${searchParams.toString()}`,
        { method: 'get' }
      );
      let response = await cache.match(request);

      if (response) {
        return await response.json();
      }

      let result = await handleQuery(query, namespace, slug, options);

      ctx.waitUntil(
        cache.put(
          request,
          new Response(JSON.stringify(result), {
            status: 200,
            method: 'get',
            headers: {
              'Cache-Control': 'public, max-age=3600',
            },
          })
        )
      );

      return result;
    };
};

export function createQuery(env, ctx): Query {
  return createRawQuery(env.CONTENT, setupQuery(ctx));
}
