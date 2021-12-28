import manifest from '__STATIC_CONTENT_MANIFEST';
import * as build from '../build/index.js';
import { createFetchHandler } from './adapter';
import { createContext } from './context';
import { createLogger } from './logging.js';

// Setup Durable Objects
export { ResourcesStore, UserStore } from './store';

const handleFetch = createFetchHandler({
  build,
  manifest,
  getLoadContext(request, env, ctx) {
    return createContext(request, env, ctx);
  },
});

const worker: ExportedHandler = {
  async fetch(request, env, ctx) {
    const logger = createLogger(
      request,
      { ...env, LOGGER_NAME: 'worker' },
      ctx
    );
    const response = await handleFetch(
      request,
      { ...env, LOGGER: logger },
      ctx
    );

    ctx.waitUntil(logger.report(response));

    return response;
  },
};

export default worker;
