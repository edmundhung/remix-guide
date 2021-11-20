import { createFetchHandler } from './adapter';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import * as build from '../build/index.js';
import entries from './entries';
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
    return {
      counter: createCounter(env.COUNTER),
      async search(params = {}) {
        const {
          keyword,
          category,
          // version,
          // platform,
        } = params;

        return entries.filter((entry) => {
          let match = true;

          if (keyword && !entry.title.includes(keyword)) {
            match = false;
          }

          if (category && entry.type !== category) {
            match = false;
          }

          return match;
        });
      },
      async support(category: string) {
        return entries.some((entry) => entry.category === category);
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
