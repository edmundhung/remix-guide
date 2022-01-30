import type { Env } from '../types';
import { getUserStore } from '../store/UserStore';

export type Store = ReturnType<typeof createStore>;

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
	const userStore = getUserStore(env, ctx);

	return {
		async getList(
			userId: string | undefined,
			guide: string | null | undefined,
			list: string | null | undefined,
		): Promise<string[] | null> {
			if (!list) {
				return null;
			}

			if (!guide && userId) {
				const user = await userStore.getUser(userId);

				switch (list) {
					case 'bookmarks':
						return user?.bookmarked ?? [];
					case 'history':
						return user?.viewed ?? [];
					default:
						return [];
				}
			}

			return null;
		},
	};
}
