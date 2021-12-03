import manifest from '__STATIC_CONTENT_MANIFEST';
import { createFetchHandler } from './adapter';
import * as build from '../build/index.js';
import { createStore } from './store';
import { createAuth } from './auth';
import { Counter } from './counter';

const handleFetch = createFetchHandler({
  build,
  manifest,
  getCache() {
    return caches.open(process.env.VERSION);
  },
  getLoadContext(request, env, ctx) {
    const auth = createAuth(request, env, ctx);
    const store = createStore(request, env, ctx);

    return {
      auth,
      store,
    };
  },
});

const worker: ExportedHandler = {
  fetch: handleFetch,
};

export default worker;

export { Counter };
