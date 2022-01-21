import { json } from 'remix';
import { createLogger } from '../logging';
import type { Env, UserProfile, User, AsyncReturnType } from '../types';

async function createUserStore(state: DurableObjectState, env: Env) {
	const { CONTENT } = env;

	let profile = (await state.storage.get<UserProfile>('profile')) ?? null;
	let bookmarked = (await state.storage.get<string[]>('bookmarked')) ?? [];
	let viewed = (await state.storage.get<string[]>('viewed')) ?? [];

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
			state.storage.put('profile', profile);
			CONTENT.put(`user/${profile.id}`, JSON.stringify(profile), {
				metadata: profile,
			});
		},
		async view(userId: string, resourceId: string): Promise<void> {
			if (profile?.id !== userId) {
				throw new Error(
					'View failed; Please ensure the request is sent to the proper DO',
				);
			}

			viewed = viewed.filter((id) => id !== resourceId);
			viewed.unshift(resourceId);
			state.storage.put('viewed', viewed);
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

			state.storage.put('bookmarked', bookmarked);
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

			state.storage.put('bookmarked', bookmarked);
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
				throw new Error('');
			} else if (url.pathname === '/' && method === 'GET') {
				const user = await this.store.getUser();

				if (user) {
					response = json({ user });
				}
			} else if (url.pathname === '/profile' && method === 'PUT') {
				const profile = await request.json<UserProfile>();

				await this.store.updateProfile(profile);

				response = new Response('OK', { status: 200 });
			} else if (url.pathname === '/view' && method === 'PUT') {
				const { userId, resourceId } = await request.json();

				await this.store.view(userId, resourceId);

				response = new Response('OK', { status: 200 });
			} else if (url.pathname === '/bookmark' && method === 'PUT') {
				const { userId, resourceId } = await request.json();

				await this.store.bookmark(userId, resourceId);

				response = new Response('OK', { status: 200 });
			} else if (url.pathname === '/bookmark' && method === 'DELETE') {
				const { userId, resourceId } = await request.json();

				await this.store.unbookmark(userId, resourceId);

				response = new Response('OK', { status: 200 });
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
