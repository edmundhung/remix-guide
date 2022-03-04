import * as build from '../build/index.js';
import { createFetchHandler, createWorkerAssetHandler } from './adapter';
import { createContext } from './context';

// Setup Durable Objects
export * from './store';

const handleFetch = createFetchHandler({
	build,
	getLoadContext(request, env, ctx) {
		return createContext(request, env, ctx);
	},
	handleAsset: createWorkerAssetHandler(build),
});

const worker: ExportedHandler = {
	fetch: handleFetch,
};

export default worker;
