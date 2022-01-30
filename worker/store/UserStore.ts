import { json } from 'remix';
import { matchCache, removeCache, updateCache } from '../cache';
import { createLogger } from '../logging';
import type { Env, UserProfile, User, AsyncReturnType } from '../types';
import { createStoreFetch } from '../utils';
import { getPageStore } from './PageStore';

async function createUserStore(state: DurableObjectState, env: Env) {
	const { storage } = state;
	const { CONTENT } = env;

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

			profile = newProfile;
			await Promise.all([
				storage.put('profile', profile),
				CONTENT.put(`user/${profile.id}`, JSON.stringify(profile), {
					metadata: profile,
				}),
			]);
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
			await storage.put(data);
		},
	};
}

export function getUserStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
) {
	const pageStore = getPageStore(env, ctx);
	const fetchStore = createStoreFetch(env.USER_STORE, 'guide');

	return {
		async getUser(userId: string): Promise<User | null> {
			let user = await matchCache<User>(`users/${userId}`);

			if (!user) {
				user = await fetchStore(userId, '/', 'GET');

				if (user) {
					ctx.waitUntil(updateCache(`users/${userId}`, user, 10800));
				}
			}

			return user;
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
			return await fetchStore(profile.id, '/profile', 'PUT', { profile });
		},
		async view(
			userId: string | null,
			bookmarkId: string,
			url: string,
		): Promise<void> {
			if (userId) {
				await fetchStore(userId, '/view', 'PUT', {
					userId,
					resourceId: bookmarkId,
				});

				ctx.waitUntil(removeCache(`users/${userId}`));
			}

			ctx.waitUntil(pageStore.view(url));
		},
		async bookmark(
			userId: string,
			bookmarkId: string,
			url: string,
		): Promise<void> {
			await fetchStore(userId, '/bookmark', 'PUT', {
				userId,
				resourceId: bookmarkId,
			});

			ctx.waitUntil(removeCache(`users/${userId}`));
			ctx.waitUntil(pageStore.bookmark(userId, url));
		},
		async unbookmark(
			userId: string,
			resourceId: string,
			url: string,
		): Promise<void> {
			await fetchStore(userId, '/bookmark', 'DELETE', { userId, resourceId });

			ctx.waitUntil(removeCache(`users/${userId}`));
			ctx.waitUntil(pageStore.unbookmark(userId, url));
		},
		async backup(userId: string): Promise<Record<string, any>> {
			return await fetchStore(userId, '/backup', 'POST');
		},
		async restore(userId: string, data: Record<string, any>): Promise<void> {
			return await fetchStore(userId, '/restore', 'POST', data);
		},
	};
}

/**
 * UserStore - A durable object that keeps user profile, bookmarks and views
 */
export class UserStore {
	env: Env;
	state: DurableObjectState;
	store: AsyncReturnType<typeof createUserStore> | null;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
		this.store = null;
		this.state.blockConcurrencyWhile(async () => {
			this.store = await createUserStore(state, env);
		});
	}

	async fetch(request: Request) {
		const logger = createLogger(request, {
			...this.env,
			LOGGER_NAME: 'store:UserStore',
		});

		let response = new Response('Not found', { status: 404 });

		try {
			let url = new URL(request.url);
			let method = request.method.toUpperCase();

			if (!this.store) {
				throw new Error(
					'The store object is unavailable; Please check if the store is initialised properly',
				);
			} else if (url.pathname === '/' && method === 'GET') {
				const user = await this.store.getUser();

				if (user) {
					response = json(user);
				}
			} else if (url.pathname === '/profile' && method === 'PUT') {
				const { profile } = await request.json();

				await this.store.updateProfile(profile);

				response = new Response(null, { status: 204 });
			} else if (url.pathname === '/view' && method === 'PUT') {
				const { userId, resourceId } = await request.json();

				await this.store.view(userId, resourceId);

				response = new Response(null, { status: 204 });
			} else if (url.pathname === '/bookmark' && method === 'PUT') {
				const { userId, resourceId } = await request.json();

				await this.store.bookmark(userId, resourceId);

				response = new Response(null, { status: 204 });
			} else if (url.pathname === '/bookmark' && method === 'DELETE') {
				const { userId, resourceId } = await request.json();

				await this.store.unbookmark(userId, resourceId);

				response = new Response(null, { status: 204 });
			} else if (url.pathname === '/backup' && method === 'POST') {
				const data = await this.store.backup();

				response = json(data);
			} else if (url.pathname === '/restore' && method === 'POST') {
				const data = await request.json<any>();

				await this.store.restore(data);

				// Re-initialise everything again
				this.store = await createUserStore(this.state, this.env);

				response = new Response(null, { status: 204 });
			}
		} catch (e) {
			if (e instanceof Error) {
				logger.error(e);
				logger.log(
					`UserStore failed while handling a fetch call - ${request.url}; Received message: ${e.message}`,
				);
			}

			response = new Response('Internal Server Error', { status: 500 });
		} finally {
			logger.report(response);
		}

		return response;
	}
}
