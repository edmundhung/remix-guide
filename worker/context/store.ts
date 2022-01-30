import type { Env, User, UserProfile } from '../types';
import { matchCache, updateCache, removeCache } from '../cache';
import { getUserStore } from '../store/UserStore';
import { getPageStore } from '../store/PageStore';

export type Store = ReturnType<typeof createStore>;

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
	const pageStore = getPageStore(env, ctx);

	async function getUser(userId: string): Promise<User | null> {
		let user = await matchCache<User>(`users/${userId}`);

		if (!user) {
			const userStore = getUserStore(env, userId);

			user = await userStore.getUser();

			if (user) {
				ctx.waitUntil(updateCache(`users/${userId}`, user, 10800));
			}
		}

		return user;
	}

	async function listUserProfiles(): Promise<UserProfile[]> {
		let list = await matchCache<UserProfile[]>('users');

		if (!list) {
			const result = await env.CONTENT.list<UserProfile>({
				prefix: 'user/',
			});

			list = result.keys.flatMap((key) => key.metadata ?? []);

			ctx.waitUntil(updateCache('users', list, 60));
		}

		return list;
	}

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
				const user = await getUser(userId);

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
		async getUser(userId: string) {
			try {
				return await getUser(userId);
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async view(
			userId: string | null,
			bookmarkId: string,
			url: string,
		): Promise<void> {
			try {
				if (userId) {
					const userStore = getUserStore(env, userId);

					await userStore.view(userId, bookmarkId);
				}

				ctx.waitUntil(removeCache(`users/${userId}`));
				ctx.waitUntil(pageStore.view(url));
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async bookmark(
			userId: string,
			bookmarkId: string,
			url: string,
		): Promise<void> {
			try {
				const userStore = getUserStore(env, userId);

				await userStore.bookmark(userId, bookmarkId);

				ctx.waitUntil(removeCache(`users/${userId}`));
				ctx.waitUntil(pageStore.bookmark(userId, url));
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async unbookmark(
			userId: string,
			bookmarkId: string,
			url: string,
		): Promise<void> {
			try {
				const userStore = getUserStore(env, userId);

				await userStore.unbookmark(userId, bookmarkId);

				ctx.waitUntil(removeCache(`users/${userId}`));
				ctx.waitUntil(pageStore.unbookmark(userId, url));
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async listUsers(): Promise<UserProfile[]> {
			try {
				return await listUserProfiles();
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async backupUser(userId: string): Promise<any> {
			try {
				const userStore = getUserStore(env, userId);

				return await userStore.backup();
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async restoreUser(
			userId: string,
			data: Record<string, any>,
		): Promise<void> {
			try {
				const userStore = getUserStore(env, userId);

				await userStore.restore(data);
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
	};
}
