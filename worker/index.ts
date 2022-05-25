import {
	createMetronomeGetLoadContext,
	registerMetronome,
} from '@metronome-sh/cloudflare-pages';
import * as build from '../build/index.js';
import { createFetchHandler, createWorkerAssetHandler } from './adapter';
import { createContext } from './context';

// Setup Durable Objects
export * from './store';

const buildWithMetronome = registerMetronome(build);
const metronomeGetLoadContext =
	createMetronomeGetLoadContext(buildWithMetronome);
const handleFetch = createFetchHandler({
	build: buildWithMetronome,
	getLoadContext(request, env, ctx) {
		const context = createContext(request, env, ctx);
		const metronome = metronomeGetLoadContext({
			request,
			env,
			waitUntil: (promise) => ctx.waitUntil(promise),
		} as any);

		return {
			...context,
			...metronome,
		};
	},
	handleAsset: createWorkerAssetHandler(buildWithMetronome),
});

const worker: ExportedHandler = {
	fetch: handleFetch,
};

export default worker;
