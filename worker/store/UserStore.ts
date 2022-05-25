import { matchCache, removeCache, updateCache } from '../cache';
import type { Env, UserProfile, User } from '../types';
import { configureStore, restoreStoreData } from '../utils';
import { getPageStore } from './PageStore';

const { Store, createClient } = configureStore(async ({ storage }, env) => {
	const { CONTENT } = env as Env;
	let [profile = null, bookmarked = [], viewed = []] = await Promise.all([
		storage.get<UserProfile>('profile'),
		storage.get<string[]>('bookmarked'),
		storage.get<string[]>('viewed'),
	]);

	return {
		async getUser(): Promise<User | null> {
			if (!profile) {
				return null;
			}

			return {
				profile,
				viewed,
				bookmarked,
			};
		},
		async updateProfile(newProfile: UserProfile): Promise<void> {
			if (profile !== null && profile.id !== newProfile.id) {
				throw new Error(
					'The user store is already registered with a different userId',
				);
			}

			const now = new Date().toISOString();
			const updated = {
				...newProfile,
				createdAt: profile?.createdAt ?? now,
				updatedAt: now,
			};

			await Promise.all([
				storage.put('profile', updated),
				CONTENT.put(`user/${updated.id}`, JSON.stringify(updated), {
					metadata: updated,
				}),
			]);

			profile = updated;
		},
		async view(userId: string, resourceId: string): Promise<void> {
			if (profile?.id !== userId) {
				throw new Error(
					'View failed; Please ensure the request is sent to the proper DO',
				);
			}

			viewed = viewed.filter((id) => id !== resourceId);
			viewed.unshift(resourceId);
			storage.put('viewed', viewed);
		},
		async bookmark(userId: string, resourceId: string): Promise<void> {
			if (profile?.id !== userId) {
				throw new Error(
					'Bookmark failed; Please ensure the request is sent to the proper DO',
				);
			}

			const isBookmarked = bookmarked.includes(resourceId);

			if (isBookmarked) {
				return;
			}

			bookmarked.unshift(resourceId);

			storage.put('bookmarked', bookmarked);
		},
		async unbookmark(userId: string, resourceId: string): Promise<void> {
			if (profile?.id !== userId) {
				throw new Error(
					'Unbookmark failed; Please ensure the request is sent to the proper DO',
				);
			}

			const isBookmarked = bookmarked.includes(resourceId);

			if (!isBookmarked) {
				return;
			}

			bookmarked = bookmarked.filter((id) => id !== resourceId);

			storage.put('bookmarked', bookmarked);
		},
		async backup(): Promise<Record<string, any>> {
			const data = await storage.list();

			return Object.fromEntries(data);
		},
		async restore(data: Record<string, any>): Promise<void> {
			await restoreStoreData(storage, data);

			[profile = null, bookmarked = [], viewed = []] = await Promise.all([
				storage.get<UserProfile>('profile'),
				storage.get<string[]>('bookmarked'),
				storage.get<string[]>('viewed'),
			]);
		},
	};
});

/**
 * UserStore - A durable object that keeps user profile, bookmarks and views
 */
export const UserStore = Store;

export function getUserStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
) {
	const pageStore = getPageStore(env, ctx);

	return {
		async getUser(userId: string): Promise<User | null> {
			const client = createClient(env.USER_STORE, userId);
			let user = await matchCache<User>(`users/${userId}`);

			if (!user) {
				user = await client.getUser();

				if (user) {
					ctx.waitUntil(updateCache(`users/${userId}`, user, 10800));
				}
			}

			return user;
		},
		async getList(
			userId: string,
			list: string | null,
		): Promise<string[] | null> {
			if (!list) {
				return null;
			}

			const user = await this.getUser(userId);

			switch (list) {
				case 'bookmarks':
					return user?.bookmarked ?? [];
				case 'history':
					return user?.viewed ?? [];
				default:
					return [];
			}
		},
		async listUserProfiles(): Promise<UserProfile[]> {
			let list = await matchCache<UserProfile[]>('users');

			if (!list) {
				const result = await env.CONTENT.list<UserProfile>({
					prefix: 'user/',
				});

				list = result.keys.flatMap((key) => key.metadata ?? []);

				ctx.waitUntil(updateCache('users', list, 60));
			}

			return list;
		},
		async updateProfile(profile: UserProfile): Promise<void> {
			const client = createClient(env.USER_STORE, profile.id);

			await client.updateProfile(profile);
		},
		async view(
			userId: string | null,
			resourceId: string,
			url: string,
		): Promise<void> {
			if (userId) {
				const client = createClient(env.USER_STORE, userId);

				await client.view(userId, resourceId);

				ctx.waitUntil(removeCache(`users/${userId}`));
			}

			ctx.waitUntil(pageStore.view(url));
		},
		async bookmark(
			userId: string,
			resourceId: string,
			url: string,
		): Promise<void> {
			const client = createClient(env.USER_STORE, userId);

			await client.bookmark(userId, resourceId);

			ctx.waitUntil(removeCache(`users/${userId}`));
			ctx.waitUntil(pageStore.bookmark(userId, url));
		},
		async unbookmark(
			userId: string,
			resourceId: string,
			url: string,
		): Promise<void> {
			const client = createClient(env.USER_STORE, userId);

			await client.unbookmark(userId, resourceId);

			ctx.waitUntil(removeCache(`users/${userId}`));
			ctx.waitUntil(pageStore.unbookmark(userId, url));
		},
		async backup(userId: string): Promise<Record<string, any>> {
			const client = createClient(env.USER_STORE, userId);

			return await client.backup();
		},
		async restore(userId: string, data: Record<string, any>): Promise<void> {
			const client = createClient(env.USER_STORE, userId);

			return await client.restore(data);
		},
	};
}
