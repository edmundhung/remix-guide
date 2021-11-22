import { createFetchHandler } from './adapter';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import * as build from '../build/index.js';
import { createQuery } from './query';

const manifest = JSON.parse(manifestJSON);

const handleFetch = createFetchHandler({
  build,
  manifest,
  cache: caches.default,
  getLoadContext(request, env, ctx) {
    const query = createQuery(env.CONTENT);

    return {
      async search(params = {}) {
        const { keyword, ...options } = params;

        return query('search', keyword ?? '', options);
      },
      async query(category: string, slug: string) {
        if (category === 'search') {
          return null;
        }

        const result = await query(category, slug);

        if (!result) {
          return null;
        }

        return result;
      },
      async support(category: string) {
        const options = await query('meta', 'category');

        if (!options) {
          return false;
        }

        return options.includes(category);
      },
    };
  },
});

const worker = {
  async fetch(request, env, ctx) {
    return handleFetch(request, env, ctx);
  },
};

export default worker;
