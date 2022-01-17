import { createSession } from './session';
import { createStore } from './store';

export type Context = ReturnType<typeof createContext>;

export function createContext(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
) {
	return {
		session: createSession(request, env, ctx),
		store: createStore(request, env, ctx),
	};
}
