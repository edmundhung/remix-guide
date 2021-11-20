import { createFetchHandler } from './adapter';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import * as build from '../build/index.js';
import { createQuery } from './query';
import { Counter } from './counter';

const manifest = JSON.parse(manifestJSON);

function createCounter(namespace: DurableObjectNamespace) {
  function getCounter(name: string): Counter {
    const id = namespace.idFromName(name);
    const obj = namespace.get(id);

    return obj;
  }

  return {
    async getCount(name: string): Promise<Number> {
      const counter = getCounter(name);
      const response = await counter.fetch('/');
      const count = await response.text();

      return Number(count);
    },
    async increment(name: string): Promise<Number> {
      const counter = getCounter(name);
      const response = await counter.fetch('/increment');
      const count = await response.text();

      return Number(count);
    },
  };
}

const handleFetch = createFetchHandler({
  build,
  manifest,
  getLoadContext(request, env, ctx) {
    const query = createQuery(env.CONTENT);

    return {
      counter: createCounter(env.COUNTER),
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

export { Counter };
