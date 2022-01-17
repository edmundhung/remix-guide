import { createLogger } from '../logging';
import type { Env, UserProfile, User } from '../types';

/**
 * UserStore - A durable object that keeps user profile, bookmarks and views
 */
export class UserStore {
	state: DurableObjectState;
	env: Env;
	profile: UserProfile;
	bookmarked: string[];
	viewed: string[];

	constructor(state, env) {
		this.state = state;
		this.env = env;
		this.state.blockConcurrencyWhile(async () => {
			let profile = await this.state.storage.get('profile');
			let bookmarked = await this.state.storage.get('bookmarked');
			let viewed = await this.state.storage.get('viewed');

			this.profile = profile ?? null;
			this.bookmarked = bookmarked ?? [];
			this.viewed = viewed ?? [];
		});
	}

	async fetch(request: Request) {
		const logger = createLogger(request, {
			...this.env,
			LOGGER_NAME: 'store:UserStore',
		});

		let response: Response;

		try {
			let url = new URL(request.url);
			let method = request.method.toUpperCase();

			switch (url.pathname) {
				case '/': {
					if (method !== 'GET') {
						break;
					}

					const user: User = {
						profile: this.profile,
						viewed: this.viewed,
						bookmarked: this.bookmarked,
					};
					const body = JSON.stringify({ user });

					response = new Response(body, { status: 200 });
					break;
				}
				case '/profile': {
					if (method !== 'PUT') {
						break;
					}

					const profile = await request.json();

					if (this.profile !== null && this.profile.id !== profile.id) {
						throw new Error(
							'The user store is already registered with a different userId',
						);
					}

					this.profile = profile;
					this.state.storage.put('profile', profile);
					this.env.CONTENT.put(`user/${profile.id}`, JSON.stringify(profile), {
						metadata: profile,
					});

					response = new Response('OK', { status: 200 });
					break;
				}
				case '/view': {
					if (method !== 'PUT') {
						break;
					}

					const { userId, resourceId } = await request.json();

					if (this.profile.id !== userId) {
						throw new Error(
							'View failed; Please ensure the request is sent to the proper DO',
						);
					}

					this.viewed = this.viewed.filter((id) => id !== resourceId);
					this.viewed.unshift(resourceId);
					this.state.storage.put('viewed', this.viewed);

					response = new Response('OK', { status: 200 });
					break;
				}
				case '/bookmark': {
					if (method !== 'PUT' && method !== 'DELETE') {
						break;
					}

					const { userId, resourceId } = await request.json();

					if (this.profile.id !== userId) {
						throw new Error(
							'Bookmark failed; Please ensure the request is sent to the proper DO',
						);
					}

					const isBookmarked = this.bookmarked.includes(resourceId);

					if (
						(method === 'PUT' && isBookmarked) ||
						(method === 'DELETE' && !isBookmarked)
					) {
						return new Response('Conflict', { status: 409 });
					}

					if (method === 'PUT') {
						this.bookmarked.unshift(resourceId);
					} else {
						this.bookmarked = this.bookmarked.filter((id) => id !== resourceId);
					}

					this.state.storage.put('bookmarked', this.bookmarked);

					response = new Response('OK', { status: 200 });
					break;
				}
			}

			if (!response) {
				response = new Response('Not found', { status: 404 });
			}
		} catch (e) {
			logger.error(e);
			logger.log(
				`UserStore failed while handling a fetch call - ${request.url}; Received message: ${e.message}`,
			);

			response = new Response('Internal Server Error', { status: 500 });
		} finally {
			logger.report(response);
		}

		return response;
	}
}
