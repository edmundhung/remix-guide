import manifest from '__STATIC_CONTENT_MANIFEST';
import { createFetchHandler } from './adapter';
import * as build from '../build/index.js';
import { createQuery } from './query';
import { createAuth } from './auth';
import { Counter, createCounter } from './counter';

const handleFetch = createFetchHandler({
  build,
  manifest,
  cache: caches.default,
  getLoadContext(request, env, ctx) {
    const auth = createAuth(request, env, ctx);
    const query = createQuery(env, ctx);
    const counter = createCounter(env.COUNTER);

    return {
      auth,
      async search(params = {}) {
        const { keyword, ...options } = params;
        const list = await query('search', keyword ?? '', options);

        try {
          const viewsByKey = await counter.check(
            'views',
            list.map((item) => `${item.category}/${item.slug}`)
          );

          return list.map((item) => ({
            ...item,
            views: viewsByKey[`${item.category}/${item.slug}`] ?? 0,
          }));
        } catch (e) {
          console.log('Gathering counts during search failed');

          return list;
        }
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
      view(category: string, slug: string): void {
        ctx.waitUntil(counter.increment('views', `${category}/${slug}`));
      },
    };
  },
});

const worker: ExportedHandler = {
  fetch: handleFetch,
};

export default worker;

export { Counter };
