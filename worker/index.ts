import * as build from '../build/index.js';
import { createFetchHandler, createWorkerAssetHandler } from './adapter';
import { getPageStore } from './store/PageStore';
import { getUserStore } from './store/UserStore';
import { getResourceStore } from './store/ResourcesStore';
import { createSession } from './session';

import type { Env } from './types';

// Setup Durable Objects
export * from './store';

declare module '@remix-run/server-runtime' {
	export interface AppLoadContext {
		session: Context['session'];
		resourceStore: Context['resourceStore'];
		pageStore: Context['pageStore'];
		userStore: Context['userStore'];
	}
}

type Context = ReturnType<typeof getLoadContext>;

function getLoadContext(request: Request, env: Env, ctx: ExecutionContext) {
	return {
		session: createSession(request, env, ctx),
		resourceStore: getResourceStore(env, ctx),
		pageStore: getPageStore(env, ctx),
		userStore: getUserStore(env, ctx),
	};
}

const worker: ExportedHandler<Env> = {
	fetch: createFetchHandler({
		build,
		getLoadContext,
		handleAsset: createWorkerAssetHandler(build),
	}),
};

export default worker;
