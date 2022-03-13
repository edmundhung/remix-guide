import { json } from 'remix';
import { configureLogger } from '../logging';
import { checkSafeBrowsingAPI, getPageDetails, scrapeHTML } from '../scraping';
import type { Env, Page, PageMetadata, AsyncReturnType } from '../types';
import { createStoreFetch, restoreStoreData } from '../utils';

type PageStatistics = Required<Pick<Page, 'bookmarkUsers' | 'viewCount'>>;

/**
 * Configure logging namespace
 */
const createLogger = configureLogger('store:PageStore');

function getPageMetadata(page: Page): PageMetadata {
	return {
		url: page.url,
		category: page.category,
		title: page.title,
		description: page.description?.slice(0, 100),
		isSafe: page.isSafe,
		createdAt: page.createdAt,
		updatedAt: page.updatedAt,
		viewCount: page.viewCount ?? 0,
		bookmarkCount: page.bookmarkUsers?.length ?? 0,
	};
}

async function createPageStore(state: DurableObjectState, env: Env) {
	const { storage } = state;

	const pageMap = await storage.list<Page>();

	function getStatistics(page: Page | undefined): PageStatistics {
		return {
			bookmarkUsers: page?.bookmarkUsers ?? [],
			viewCount: page?.viewCount ?? 0,
		};
	}

	async function updatePage(url: string, page: Page): Promise<void> {
		pageMap.set(url, page);

		await storage.put(url, page);
	}

	return {
		async getPage(url: string) {
			const page = pageMap.get(url);

			return page ?? null;
		},
		async list() {
			return Object.fromEntries(pageMap.entries());
		},
		async refresh(url: string, page: Page) {
			const cachedPage = pageMap.get(url);
			const statistics = getStatistics(cachedPage ?? page);

			await updatePage(url, {
				...page,
				...statistics,
				createdAt: cachedPage?.createdAt ?? page.createdAt,
				updatedAt: page.createdAt,
			});
		},
		async view(url: string) {
			const page = pageMap.get(url);
			const statistics = getStatistics(page);

			if (!page) {
				throw new Error(`No existing page found for ${url}`);
			}

			await updatePage(url, {
				...page,
				viewCount: statistics.viewCount + 1,
			});
		},
		async bookmark(userId: string, url: string) {
			const page = pageMap.get(url);
			const statistics = getStatistics(page);

			if (!page) {
				throw new Error(`No existing page found for ${url}`);
			}

			if (statistics.bookmarkUsers.includes(userId)) {
				return;
			}

			await updatePage(url, {
				...page,
				bookmarkUsers: statistics.bookmarkUsers.concat(userId),
			});
		},
		async unbookmark(userId: string, url: string) {
			const page = pageMap.get(url);
			const statistics = getStatistics(page);

			if (!page) {
				throw new Error(`No existing page found for ${url}`);
			}

			if (!statistics.bookmarkUsers.includes(userId)) {
				return;
			}

			await updatePage(url, {
				...page,
				bookmarkUsers: statistics.bookmarkUsers.filter((id) => id !== userId),
			});
		},
		async backup(): Promise<Record<string, any>> {
			const data = await storage.list();

			return Object.fromEntries(data);
		},
		async restore(data: Record<string, any>): Promise<void> {
			await restoreStoreData(storage, data);
		},
	};
}

export function getPageStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
): AsyncReturnType<typeof createPageStore> & {
	getOrCreatePage: (url: string) => Promise<Page>;
	listPageMetadata: () => Promise<PageMetadata[]>;
	refresh: (url: string) => Promise<void>;
} {
	const { PAGE_STORE, GOOGLE_API_KEY, USER_AGENT } = env;
	const fetchStore = createStoreFetch(PAGE_STORE, 'page');
	const storeName = 'global';

	async function createPage(url: string): Promise<Page> {
		const page = await scrapeHTML(url, USER_AGENT);
		const [pageDetails, isSafe] = await Promise.all([
			getPageDetails(page.url, env),
			GOOGLE_API_KEY
				? checkSafeBrowsingAPI([page.url], GOOGLE_API_KEY)
				: process.env.NODE_ENV !== 'production', // Consider URL as safe for non production environment without GOOGLE_API_KEY,
		]);

		return {
			...page,
			...pageDetails,
			isSafe,
		};
	}

	return {
		async getPage(url: string) {
			return await fetchStore(storeName, '/details', 'GET', { url });
		},
		async list() {
			return await fetchStore(storeName, '/list', 'GET');
		},
		async listPageMetadata() {
			const data = await this.list();

			return Object.values(data)
				.map(getPageMetadata)
				.sort(
					(prev, next) =>
						new Date(next.createdAt).valueOf() -
						new Date(prev.createdAt).valueOf(),
				);
		},
		async getOrCreatePage(url: string) {
			let page = await this.getPage(url);

			if (!page) {
				page = await createPage(url);

				ctx.waitUntil(
					fetchStore(storeName, '/refresh', 'POST', { url: page.url, page }),
				);
			}

			return page;
		},
		async refresh(url: string) {
			return await fetchStore(storeName, '/refresh', 'POST', {
				url,
				page: await createPage(url),
			});
		},
		async view(url: string) {
			return await fetchStore(storeName, '/view', 'POST', { url });
		},
		async bookmark(userId: string, url: string) {
			return await fetchStore(storeName, '/bookmark', 'POST', { userId, url });
		},
		async unbookmark(userId: string, url: string) {
			return await fetchStore(storeName, '/unbookmark', 'POST', {
				userId,
				url,
			});
		},
		async backup() {
			return await fetchStore(storeName, '/backup', 'POST');
		},
		async restore(data: Record<string, any>) {
			return await fetchStore(storeName, '/restore', 'POST', data);
		},
	};
}

/**
 * PageStore - A durable object that orchestrate page updates
 */
export class PageStore {
	env: Env;
	state: DurableObjectState;
	store: AsyncReturnType<typeof createPageStore> | null;

	constructor(state: DurableObjectState, env: Env) {
		this.env = env;
		this.state = state;
		this.store = null;
		state.blockConcurrencyWhile(async () => {
			this.store = await createPageStore(state, env);
		});
	}

	async fetch(request: Request) {
		const logger = createLogger(request, this.env);
		const url = new URL(request.url);
		const method = request.method.toUpperCase();

		let response = new Response('Not found', { status: 404 });

		try {
			if (!this.store) {
				throw new Error(
					'The store object is unavailable; Please check if the store is initialised properly',
				);
			}

			if (method === 'GET') {
				switch (url.pathname) {
					case '/details': {
						const pageUrl = url.searchParams.get('url');
						const data = pageUrl ? await this.store.getPage(pageUrl) : null;

						response = data
							? json(data)
							: new Response('Not found', { status: 404 });
						break;
					}
					case '/list': {
						const data = await this.store.list();

						response = json(data);
						break;
					}
				}
			} else if (method === 'POST') {
				switch (url.pathname) {
					case '/refresh': {
						const { url, page } = await request.json();

						await this.store.refresh(url, page);

						response = new Response(null, { status: 204 });
						break;
					}
					case '/view': {
						const { url } = await request.json();

						await this.store.view(url);

						response = new Response(null, { status: 204 });
						break;
					}
					case '/bookmark': {
						const { userId, url } = await request.json();

						await this.store.bookmark(userId, url);

						response = new Response(null, { status: 204 });
						break;
					}
					case '/unbookmark': {
						const { userId, url } = await request.json();

						await this.store.unbookmark(userId, url);

						response = new Response(null, { status: 204 });
						break;
					}
					case '/backup': {
						const data = await this.store.backup();

						response = json(data);
						break;
					}
					case '/restore': {
						const data = await request.json<any>();

						await this.store.restore(data);

						// Re-initialise everything again
						this.store = await createPageStore(this.state, this.env);

						response = new Response(null, { status: 204 });
						break;
					}
				}
			}
		} catch (e) {
			console.log('error', e);
			if (e instanceof Error) {
				logger.error(e);
				logger.log(
					`PageStore failed handling ${method} ${url.pathname}; Received message: ${e.message}`,
				);
			}

			response = new Response('Internal Server Error', { status: 500 });
		} finally {
			logger.report(response);
		}

		return response;
	}
}
