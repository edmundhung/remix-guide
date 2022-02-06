import { getPageStore } from '../store/PageStore';
import { getUserStore } from '../store/UserStore';
import { getResourceStore } from '../store/ResourcesStore';
import type { Env } from '../types';
import { createSession } from './session';

export type Context = ReturnType<typeof createContext>;

export function createContext(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
) {
	return {
		session: createSession(request, env, ctx),
		resourceStore: getResourceStore(env, ctx),
		pageStore: getPageStore(env, ctx),
		userStore: getUserStore(env, ctx),
	};
}
