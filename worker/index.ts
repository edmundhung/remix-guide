import manifest from '__STATIC_CONTENT_MANIFEST';
import * as build from '../build/index.js';
import { createFetchHandler } from './adapter';
import { createContext } from './context';

// Setup Durable Objects
export { EntriesStore, UserStore } from './store';

const handleFetch = createFetchHandler({
  build,
  manifest,
  getCache() {
    return caches.open(process.env.VERSION);
  },
  getLoadContext(request, env, ctx) {
    return createContext(request, env, ctx);
  },
});

const worker: ExportedHandler = {
  fetch: handleFetch,
};

export default worker;
