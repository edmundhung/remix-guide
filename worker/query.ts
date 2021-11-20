import type { Query, SetupQueryFunction } from '@workaholic/core';
import { createQuery as createRawQuery } from '@workaholic/core';
import Fuse from 'fuse.js';

const keys = [
  { name: 'category', weight: 5 },
  { name: 'author', weight: 4 },
  { name: 'title', weight: 3 },
  { name: 'description', weight: 1 },
  { name: 'remixVersions', weight: 5 },
  { name: 'platforms', weight: 4 },
];

let setupQuery: SetupQueryFunction = () => {
  function handleSearch(list, index, keyword) {
    if (keyword === '') {
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

  return (query) => async (namespace: string, slug: string) => {
    switch (namespace) {
      case 'search':
        const [list, index] = await Promise.all([
          query(namespace, 'list', { type: 'json' }),
          query(namespace, 'index', { type: 'json' }),
        ]);

        if (!list || !index) {
          return [];
        }

        return handleSearch(list, index, slug);
      default:
        return await query(namespace, slug, { type: 'json' });
    }
  };
};

export function createQuery(kvNamespace: KVNamespace): Query {
  return createRawQuery(kvNamespace, setupQuery());
}
