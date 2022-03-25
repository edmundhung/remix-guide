import { scrapeHTML, getPageDetails, checkSafeBrowsingAPI } from '../scraping';
import { Env, Page, PageMetadata } from '../types';
import { configureStore, restoreStoreData } from '../utils';

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

const { Store, createClient } = configureStore(async ({ storage }, env) => {
	let pageMap = await initialise();

	async function initialise() {
		return await storage.list<Page>();
	}

	function getStatistics(page: Page | undefined): PageStatistics {
		return {
			bookmarkUsers: page?.bookmarkUsers ?? [],
			viewCount: page?.viewCount ?? 0,
		};
	}

	async function getPage(url: string) {
		const page = pageMap.get(url);

		return page ?? null;
	}

	async function updatePage(url: string, page: Page): Promise<void> {
		pageMap.set(url, page);

		await storage.put(url, page);
	}

	async function list() {
		return Object.fromEntries(pageMap.entries());
	}

	async function refresh(url: string, page: Page) {
		const cachedPage = pageMap.get(url);
		const statistics = getStatistics(cachedPage ?? page);

		await updatePage(url, {
			...page,
			...statistics,
			createdAt: cachedPage?.createdAt ?? page.createdAt,
			updatedAt: page.createdAt,
		});
	}

	async function view(url: string) {
		const page = pageMap.get(url);
		const statistics = getStatistics(page);

		if (!page) {
			throw new Error(`No existing page found for ${url}`);
		}

		await updatePage(url, {
			...page,
			viewCount: statistics.viewCount + 1,
		});
	}

	async function bookmark(userId: string, url: string) {
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
	}

	async function unbookmark(userId: string, url: string) {
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
	}

	return {
		getPage,
		list,
		refresh,
		view,
		bookmark,
		unbookmark,
		async backup(): Promise<Record<string, any>> {
			const data = await storage.list();

			return Object.fromEntries(data);
		},
		async restore(data: Record<string, any>): Promise<void> {
			await restoreStoreData(storage, data);
			pageMap = await initialise();
		},
	};
});

export const PageStore = Store;

export function getPageStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
) {
	const { PAGE_STORE, GOOGLE_API_KEY, USER_AGENT } = env;
	const client = createClient(PAGE_STORE, 'global');

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
			return await client.getPage(url);
		},
		async list() {
			return await client.list();
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

				ctx.waitUntil(client.refresh(page.url, page));
			}

			return page;
		},
		async refresh(url: string) {
			return await client.refresh(url, await createPage(url));
		},
		async view(url: string) {
			return await client.view(url);
		},
		async bookmark(userId: string, url: string) {
			return await client.bookmark(userId, url);
		},
		async unbookmark(userId: string, url: string) {
			return await client.unbookmark(userId, url);
		},
		async backup() {
			return await client.backup();
		},
		async restore(data: Record<string, any>) {
			return await client.restore(data);
		},
	};
}
