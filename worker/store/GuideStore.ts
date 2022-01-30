import { json } from 'remix';
import { createLogger } from '../logging';
import { createStoreFetch, generateId } from '../utils';
import type {
	Env,
	AsyncReturnType,
	SubmissionStatus,
	Guide,
	BookmarkList,
	BookmarkMetadata,
	Bookmark,
} from '../types';
import { getIntegrations, getIntegrationsFromPage } from '../scraping';
import { getPageStore } from './PageStore';

async function createGuideStore(state: DurableObjectState, env: Env) {
	const { storage } = state;
	const pageStore = getPageStore(env, state);

	async function getBookmark(
		metadata: BookmarkMetadata,
	): Promise<Bookmark | null> {
		const page = await pageStore.getPage(metadata.url);

		if (!page) {
			return null;
		}

		return {
			...metadata,
			title: page.title,
			description: page.description,
			author: page.author,
			category: page.category,
			image: page.image,
			video: page.video,
			isSafe: page.isSafe,
			bookmarkCount: page.bookmarkUsers?.length ?? 0,
			viewCount: page.viewCount ?? 0,
			integrations:
				page.category === 'package' || page.category === 'repository'
					? getIntegrations(
							page.configs ?? [],
							packages,
							page.dependencies ?? {},
					  )
					: getIntegrationsFromPage(page, packages),
		};
	}

	const [
		listMap = new Map<string, BookmarkList>(),
		urlMap = new Map<string, string>(),
		packages = [],
	] = await Promise.all([
		storage.list<BookmarkList>({ prefix: 'list/' }),
		storage.list<string>({ prefix: 'url/' }),
		storage.get<string[]>('packages'),
	]);

	return {
		async getGuide(): Promise<Guide> {
			return {
				lists: Array.from(listMap.values()),
			};
		},
		async getBookmarks(): Promise<Bookmark[]> {
			const bookmarkMap = await storage.list<BookmarkMetadata>({
				prefix: 'bookmark/',
				reverse: true,
			});
			const bookmarks = await Promise.all(
				Array.from(bookmarkMap.values()).map<Promise<Bookmark | null>>(
					getBookmark,
				),
			);

			return bookmarks.filter(
				(bookmark): bookmark is Bookmark => bookmark !== null,
			);
		},
		async createBookmark(
			url: string,
		): Promise<{ bookmarkId: string | null; status: SubmissionStatus }> {
			let status: SubmissionStatus | null = null;
			let page = await pageStore.getOrCreatePage(url);

			if (!page.isSafe) {
				return {
					bookmarkId: null,
					status: 'INVALID',
				};
			}

			let bookmarkId = urlMap.get(`url/${page.url}`);

			if (!bookmarkId) {
				bookmarkId = generateId();

				await Promise.all([
					storage.put<BookmarkMetadata>(`bookmark/${bookmarkId}`, {
						id: bookmarkId,
						url: page.url,
						lists: [],
						timestamp: new Date().toISOString(),
					}),
					storage.put<string>(`url/${page.url}`, bookmarkId),
					page.title && page.category === 'package'
						? storage.put<string[]>('packages', packages.concat(page.title))
						: null,
				]);

				if (page.title && page.category === 'package') {
					packages.push(page.title);
				}

				urlMap.set(`url/${page.url}`, bookmarkId);
				status = 'PUBLISHED';
			} else {
				status = 'RESUBMITTED';
			}

			return { bookmarkId, status };
		},
		async updateBookmark(bookmarkId: string, listSlug: string): Promise<void> {
			const list = listMap.get(`list/${listSlug}`);

			if (!list) {
				throw new Error(`Unknown list value found; Received ${listSlug}`);
			}

			const metadata = await storage.get<BookmarkMetadata>(
				`bookmark/${bookmarkId}`,
			);

			if (!metadata) {
				throw new Error(`Unknown bookmarkId found; Received ${bookmarkId}`);
			}

			const now = new Date().toISOString();
			const isBookmarked = metadata.lists.includes(listSlug);
			const updatedMetadata = {
				...metadata,
				lists: isBookmarked
					? metadata.lists.filter((slug) => slug !== listSlug)
					: metadata.lists.concat(listSlug),
			};
			const updatedList = {
				...list,
				bookmarkIds: isBookmarked
					? list.bookmarkIds.filter((id) => id !== bookmarkId)
					: list.bookmarkIds.concat(bookmarkId),
				updatedAt: now,
			};

			await Promise.all([
				storage.put(`bookmark/${bookmarkId}`, updatedMetadata),
				storage.put(`list/${listSlug}`, updatedList),
			]);

			listMap.set(`list/${listSlug}`, updatedList);
		},
		async deleteBookmark(bookmarkId: string): Promise<void> {
			const metadata = await storage.get<BookmarkMetadata>(
				`bookmark/${bookmarkId}`,
			);

			if (!metadata) {
				throw new Error(`Unknown bookmarkId found; Received ${bookmarkId}`);
			}

			const now = new Date().toISOString();
			const lists = metadata.lists
				.map((slug) => {
					const list = listMap.get(`list/${slug}`);

					if (!list) {
						return null;
					}

					return {
						...list,
						bookmarkIds: list.bookmarkIds.filter((id) => id !== bookmarkId),
						updatedAt: now,
					};
				})
				.filter((list): list is BookmarkList => list !== null);

			await Promise.all([
				state.storage.delete(`bookmark/${bookmarkId}`),
				...lists.map((list) => state.storage.put(`list/${list.slug}`, list)),
			]);

			for (const list of lists) {
				listMap.set(`list/${list.slug}`, list);
			}
		},
		async createList(slug: string): Promise<void> {
			if (listMap.has(`list/${slug}`)) {
				throw new Error(`List with slug ${slug} is already exists`);
			}

			const now = new Date().toISOString();
			const list: BookmarkList = {
				slug,
				title: '',
				bookmarkIds: [],
				createdAt: now,
				updatedAt: now,
			};

			await storage.put(`list/${slug}`, list);
			listMap.set(`list/${slug}`, list);
		},
		async updateList(
			slug: string,
			title: string,
			description: string,
		): Promise<void> {
			const list = listMap.get(`list/${slug}`);

			if (!list) {
				throw new Error(`Unknown list slug found; Received ${slug}`);
			}

			const now = new Date().toISOString();
			const updatedList = {
				...list,
				title,
				description,
				updatedAt: now,
			};

			await storage.put(`list/${slug}`, updatedList);
			listMap.set(`list/${slug}`, updatedList);
		},
		async deleteList(slug: string): Promise<void> {
			const list = listMap.get(`list/${slug}`);

			if (!list) {
				throw new Error(`Unknown list slug found; Received ${slug}`);
			}

			await Promise.all([
				...list.bookmarkIds.map(async (bookmarkId) => {
					const bookmark = await storage.get<BookmarkMetadata>(
						`bookmark/${bookmarkId}`,
					);

					if (!bookmark) {
						return;
					}

					await storage.put<BookmarkMetadata>(`bookmark/${bookmarkId}`, {
						...bookmark,
						lists: bookmark.lists.filter((list) => list !== slug),
					});
				}),
				storage.delete(`list/${slug}`),
			]);
			listMap.delete(`list/${slug}`);
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

export function getGuideStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
) {
	const fetchStore = createStoreFetch(env.GUIDE_STORE, 'guide');

	return {
		async getGuide(guide: string): Promise<Guide> {
			return await fetchStore(guide, '/', 'GET');
		},
		async getBookmarks(guide: string): Promise<Bookmark[]> {
			let bookmarks = await env.CONTENT.get<Bookmark[]>(
				`bookmarks/${guide}`,
				'json',
			);

			if (!bookmarks) {
				bookmarks = await fetchStore(guide, '/bookmarks', 'GET');

				if (bookmarks) {
					await env.CONTENT.put(
						`bookmarks/${guide}`,
						JSON.stringify(bookmarks),
						{
							expirationTtl: 86400,
						},
					);
				}
			}

			return bookmarks ?? [];
		},
		async createBookmark(
			guide: string,
			url: string,
		): Promise<{ bookmarkId: string | null; status: SubmissionStatus }> {
			const result = await fetchStore(guide, '/bookmarks', 'POST', { url });

			if (result.status === 'PUBLISHED') {
				ctx.waitUntil(env.CONTENT.delete(`bookmarks/${guide}`));
			}

			return result;
		},
		async updateBookmark(
			guide: string,
			bookmarkId: string,
			list: string,
		): Promise<void> {
			return await fetchStore(guide, '/bookmarks', 'PUT', { bookmarkId, list });
		},
		async deleteBookmark(guide: string, bookmarkId: string): Promise<void> {
			return await fetchStore(guide, '/bookmarks', 'DELETE', { bookmarkId });
		},
		async createList(guide: string, slug: string): Promise<void> {
			return await fetchStore(guide, '/lists', 'POST', { slug });
		},
		async updateList(
			guide: string,
			list: string,
			title: string,
			description: string,
		): Promise<void> {
			return await fetchStore(guide, '/lists', 'PUT', {
				list,
				title,
				description,
			});
		},
		async deleteList(guide: string, list: string): Promise<void> {
			return await fetchStore(guide, '/lists', 'DELETE', { list });
		},
		async backup(guide: string): Promise<Record<string, any>> {
			return await fetchStore(guide, '/backup', 'POST');
		},
		async restore(guide: string, data: Record<string, any>): Promise<void> {
			return await fetchStore(guide, '/restore', 'POST', data);
		},
	};
}

/**
 * GuideStore - A durable object that keeps bookmarks and lists
 */
export class GuideStore {
	env: Env;
	state: DurableObjectState;
	store: AsyncReturnType<typeof createGuideStore> | null;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.env = env;
		this.store = null;
		this.state.blockConcurrencyWhile(async () => {
			this.store = await createGuideStore(state, env);
		});
	}

	async fetch(request: Request) {
		const url = new URL(request.url);
		const method = request.method.toUpperCase();
		const logger = createLogger(request, {
			...this.env,
			LOGGER_NAME: 'store:GuideStore',
		});

		let response = new Response('Not found', { status: 404 });

		try {
			const method = request.method.toUpperCase();

			if (!this.store) {
				throw new Error(
					'The store object is unavailable; Please check if the guide is initialised properly',
				);
			}

			switch (url.pathname) {
				case '/':
					if (method === 'GET') {
						const data = await this.store.getGuide();

						response = json(data);
					}
					break;
				case '/bookmarks':
					if (method === 'GET') {
						const data = await this.store.getBookmarks();

						response = json(data);
					} else if (method === 'POST') {
						const { url } = await request.json();
						const data = await this.store.createBookmark(url);

						response = json(data);
					} else if (method === 'PUT') {
						const { bookmarkId, list } = await request.json();

						await this.store.updateBookmark(bookmarkId, list);

						response = new Response(null, { status: 204 });
					} else if (method === 'DELETE') {
						const { bookmarkId } = await request.json();

						await this.store.deleteBookmark(bookmarkId);

						response = new Response(null, { status: 204 });
					}
					break;
				case '/lists':
					if (method === 'POST') {
						const { slug } = await request.json();

						await this.store.createList(slug);

						response = new Response(null, { status: 204 });
					} else if (method === 'PUT') {
						const { list, title, description } = await request.json();
						await this.store.updateList(list, title, description);

						response = new Response(null, { status: 204 });
					} else if (method === 'DELETE') {
						const { list } = await request.json();
						await this.store.deleteList(list);

						response = new Response(null, { status: 204 });
					}
					break;
				case '/backup':
					if (method === 'POST') {
						const data = await this.store.backup();

						response = json(data);
					}
					break;
				case '/restore':
					if (method === 'POST') {
						const data = await request.json<any>();

						await this.store.restore(data);

						// Re-initialise everything again
						this.store = await createGuideStore(this.state, this.env);

						response = new Response(null, { status: 204 });
					}
					break;
			}
		} catch (e) {
			if (e instanceof Error) {
				logger.error(e);
				logger.log(
					`GuideStore failed handling ${method} ${url.pathname}; Received message: ${e.message}`,
				);
			}

			response = new Response('Internal Server Error', { status: 500 });
		} finally {
			logger.report(response);
		}

		return response;
	}
}
