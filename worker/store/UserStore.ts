import { json } from 'remix';
import { createLogger } from '../logging';
import type { Env, UserProfile, User, AsyncReturnType } from '../types';

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
	name: string,
): AsyncReturnType<typeof createUserStore> {
	const id = env.USER_STORE.idFromName(name);
	const store = env.USER_STORE.get(id);

	async function request(
		pathname: string,
		method: string,
		data?: Record<string, any>,
	) {
		const body = data ? JSON.stringify(data) : null;
		const response = await store.fetch(`http://${name}.user${pathname}`, {
			method,
			body,
		});

		if (response.status === 204) {
			return;
		}

		if (!response.ok) {
			throw new Error(
				`Request ${method} ${pathname} failed; Received response with status ${response.status}`,
			);
		}

		return await response.json<any>();
	}

	return {
		async getUser() {
			return await request('/', 'GET');
		},
		async updateProfile(profile: UserProfile) {
			return await request('/profile', 'PUT', { profile });
		},
		async view(userId: string, resourceId: string) {
			return await request('/view', 'PUT', { userId, resourceId });
		},
		async bookmark(userId: string, resourceId: string) {
			return await request('/bookmark', 'PUT', { userId, resourceId });
		},
		async unbookmark(userId: string, resourceId: string) {
			return await request('/bookmark', 'DELETE', { userId, resourceId });
		},
		async backup() {
			return await request('/backup', 'POST');
		},
		async restore(data: Record<string, any>) {
			return await request('/restore', 'POST', data);
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
