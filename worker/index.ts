import { createFetchHandler } from './adapter';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import * as build from '../build/index.js';
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
      search(params = {}) {
        const {
          keyword,
          category,
          // version,
          // platform,
        } = params;

        const entries = [
          {
            id: 'andwqiofqei',
            url: 'https://edmund.dev/articles/deploying-remix-app-on-cloudflare-workers',
            type: 'articles',
            title: 'Deploying Remix app on Cloudflare Workers',
            description:
              'Step by step guide on how to deploy your remix app to Cloudflare Workers using the `remix-worker-template`',
            tags: ['Cloudflare Workers'],
          },
          {
            id: 'wrgrgrg',
            url: 'https://github.com/sergiodxa/remix-auth',
            type: 'packages',
            title: 'remix-auth',
            description: 'Simple Authentication for Remix',
          },
          {
            id: '435frgg',
            url: 'https://github.com/jacob-ebey/remix-css-modules',
            type: 'templates',
            title: 'remix-css-modules',
          },
          {
            id: 'rgjoer',
            url: 'https://kentcdodds.com',
            type: 'examples',
            title: 'kentcdodds.com',
          },
          {
            id: 'gwrgjrig',
            url: 'https://www.youtube.com/watch?v=bfLFHp7Sbkg',
            type: 'others',
            title:
              'CDN Caching, Static Site Generation, and Server Side Rendering',
          },
        ];

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
