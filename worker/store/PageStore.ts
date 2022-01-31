import { json } from 'remix';
import { createLogger } from '../logging';
import { checkSafeBrowsingAPI, getPageDetails, scrapeHTML } from '../scraping';
import type { Env, Page, PageMetadata, AsyncReturnType } from '../types';
import { createStoreFetch } from '../utils';

type PageStatistics = Required<Pick<Page, 'bookmarkUsers' | 'viewCount'>>;

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
	const { PAGE } = env;

	const pageMap = new Map<string, Page>();
	const statMap = await storage.list<PageStatistics>({
		prefix: 'stat/',
	});

	function getStatistics(url: string): PageStatistics {
		return statMap.get(`stat/${url}`) ?? { bookmarkUsers: [], viewCount: 0 };
	}

	async function updateStatistics(
		url: string,
		statistics: PageStatistics,
	): Promise<void> {
		statMap.set(`stat/${url}`, statistics);

		await Promise.all([
			storage.put(`stat/${url}`, statistics),
			updatePage(url, statistics),
		]);
	}

	async function getPage(url: string): Promise<Page> {
		let page = pageMap.get(url) ?? null;

		if (!page) {
			page = await PAGE.get<Page>(url, 'json');

			if (!page) {
				throw new Error(`No existing page found for ${url}`);
			}

			pageMap.set(url, page);
		}

		return page;
	}

	async function updatePage(url: string, update: Partial<Page>): Promise<void> {
		const page = await getPage(url);
		const updatedPage = {
			...page,
			...update,
			createdAt: page.createdAt,
		};

		pageMap.set(url, updatedPage);

		await PAGE.put(url, JSON.stringify(updatedPage), {
			metadata: getPageMetadata(updatedPage),
		});
	}

	return {
		async refresh(url: string, page: Page) {
			const statistics = getStatistics(url);

			await updatePage(url, {
				...page,
				...statistics,
				updatedAt: new Date().toISOString(),
			});
		},
		async view(url: string) {
			const statistics = getStatistics(url);

			await updateStatistics(url, {
				...statistics,
				viewCount: statistics.viewCount + 1,
			});
		},
		async bookmark(userId: string, url: string) {
			const statistics = getStatistics(url);

			if (statistics.bookmarkUsers.includes(userId)) {
				return;
			}

			await updateStatistics(url, {
				...statistics,
				bookmarkUsers: statistics.bookmarkUsers.concat(userId),
			});
		},
		async unbookmark(userId: string, url: string) {
			const statistics = getStatistics(url);

			if (!statistics.bookmarkUsers.includes(userId)) {
				return;
			}

			await updateStatistics(url, {
				...statistics,
				bookmarkUsers: statistics.bookmarkUsers.filter((id) => id !== userId),
			});
		},
		async backup(): Promise<Record<string, any>> {
			const data = await storage.list();

			return Object.fromEntries(data);
		},
		async restore(data: Record<string, any>): Promise<void> {
			const batches = [];
			const keys = Object.keys(data);

			for (let i = 0; i * 128 < keys.length; i++) {
				const entires = keys
					.slice(i * 128, (i + 1) * 128)
					.reduce((result, key) => {
						result[key] = data[key];

						return result;
					}, {} as Record<string, any>);

				batches.push(entires);
			}

			await Promise.all(batches.map((entries) => storage.put(entries)));
		},
	};
}

export function getPageStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
): AsyncReturnType<typeof createPageStore> & {
	getOrCreatePage: (url: string) => Promise<Page>;
	getPage: (url: string) => Promise<Page | null>;
	listPageMetadata: () => Promise<PageMetadata[]>;
	refresh: (url: string) => Promise<void>;
} {
	const { PAGE, PAGE_STORE, GOOGLE_API_KEY, USER_AGENT } = env;
	const fetchStore = createStoreFetch(PAGE_STORE, 'page');
	const storeName = 'global';

	return {
		async getPage(url: string) {
			let page = await PAGE.get<Page>(url, 'json');

			return page;
		},
		async listPageMetadata() {
			const result = await PAGE.list<PageMetadata>();
			const list = result.keys
				.flatMap((key) => key.metadata ?? [])
				.sort(
					(prev, next) =>
						new Date(next.createdAt).valueOf() -
						new Date(prev.createdAt).valueOf(),
				);

			return list;
		},
		async getOrCreatePage(url: string) {
			let page = await PAGE.get<Page>(url, 'json');

			if (!page) {
				page = await scrapeHTML(url, USER_AGENT);

				const [pageDetails, isSafe] = await Promise.all([
					getPageDetails(page.url, env),
					GOOGLE_API_KEY
						? checkSafeBrowsingAPI([page.url], GOOGLE_API_KEY)
						: false,
				]);

				page = {
					...page,
					...pageDetails,
					isSafe,
				};

				PAGE.put(page.url, JSON.stringify(page), {
					metadata: getPageMetadata(page),
				});
			}

			return page;
		},
		async refresh(url: string) {
			const [page, pageDetails, isSafe] = await Promise.all([
				scrapeHTML(url, USER_AGENT),
				getPageDetails(url, env),
				GOOGLE_API_KEY ? checkSafeBrowsingAPI([url], GOOGLE_API_KEY) : false,
			]);

			return await fetchStore(storeName, '/refresh', 'POST', {
				url,
				page: {
					...page,
					...pageDetails,
					isSafe,
				},
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
		const url = new URL(request.url);
		const method = request.method.toUpperCase();
		const logger = createLogger(request, {
			...this.env,
			LOGGER_NAME: 'store:PageStore',
		});

		let response = new Response('Not found', { status: 404 });

		try {
			const method = request.method.toUpperCase();

			if (!this.store) {
				throw new Error(
					'The store object is unavailable; Please check if the store is initialised properly',
				);
			}

			if (method === 'POST') {
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
