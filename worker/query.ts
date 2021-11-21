import type { Query, SetupQueryFunction } from '@workaholic/core';
import { createQuery as createRawQuery } from '@workaholic/core';
import Fuse from 'fuse.js';

const keys = [
  { name: 'category', weight: 5 },
  { name: 'author', weight: 4 },
  { name: 'title', weight: 3 },
  { name: 'description', weight: 1 },
  { name: 'version', weight: 5 },
  { name: 'platforms', weight: 4 },
];

let setupQuery: SetupQueryFunction = () => {
  function match(list, options) {
    const { categories, version, platform, author, packageName } =
      options ?? {};

    return list.filter((item) => {
      if (categories && !categories.includes(item.category)) {
        return false;
      }

      if (version && item.version !== category) {
        return false;
      }

      if (platform && !item.platforms?.includes(platform)) {
        return false;
      }

      if (author && item.author !== author) {
        return false;
      }

      if (packageName && !item.packages?.includes(packageName)) {
        return false;
      }

      return true;
    });
  }

  function handleSearch(list, index, keyword) {
    if (!keyword) {
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

  return (query) =>
    async (namespace: string, slug: string, options: Record<string, any>) => {
      switch (namespace) {
        case 'search':
          const [list, index] = await Promise.all([
            query(namespace, 'list', { type: 'json' }),
            query(namespace, 'index', { type: 'json' }),
          ]);

          if (!list) {
            return [];
          }

          const result = match(list, options);

          if (!index) {
            return result;
          }

          return handleSearch(result, index, slug);
        default:
          return await query(namespace, slug, { type: 'json' });
      }
    };
};

export function createQuery(kvNamespace: KVNamespace): Query {
  return createRawQuery(kvNamespace, setupQuery());
}
