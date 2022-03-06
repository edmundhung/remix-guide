import { customAlphabet } from 'nanoid';
import { json } from 'remix';
import { configureLogger } from '../logging';
import { getIntegrations, getIntegrationsFromPage } from '../scraping';
import type {
	Env,
	Page,
	Resource,
	ResourceSummary,
	SubmissionStatus,
	AsyncReturnType,
} from '../types';
import { createStoreFetch, restoreStoreData } from '../utils';
import { getPageStore } from './PageStore';

/**
 * ID Generator based on nanoid
 * Using alphabets and digits only
 */
const generateId = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	12,
);

/**
 * Configure logging namespace
 */
const createLogger = configureLogger('store:ResourcesStore');

async function createResourceStore(state: DurableObjectState, env: Env) {
	const { storage } = state;
	const pageStore = getPageStore(env, state);

	const resourceIdByURL =
		(await storage.get<Record<string, string | undefined>>('index/URL')) ?? {};
	const resourceIdByPackageName =
		(await storage.get<Record<string, string | undefined>>(
			'index/PackageName',
		)) ?? {};

	async function createResource(
		page: Page,
		userId: string,
	): Promise<{
		id: string | null;
		status: SubmissionStatus;
	}> {
		const id = generateId();
		const now = new Date().toISOString();

		await updateResource({
			id,
			url: page.url,
			createdAt: now,
			createdBy: userId,
			updatedAt: now,
			updatedBy: userId,
		});

		if (page.category === 'package') {
			resourceIdByPackageName[page.title] = id;
			storage.put('index/PackageName', resourceIdByPackageName);
		}

		return {
			id,
			status: 'PUBLISHED',
		};
	}

	async function updateResource(resource: ResourceSummary): Promise<void> {
		await storage.put(`resources/${resource.id}`, resource);
	}

	return {
		async list() {
			const [resourceSummaryMap, pageDictionary] = await Promise.all([
				storage.list<ResourceSummary>({ prefix: 'resources/' }),
				pageStore.list(),
			]);

			return Object.fromEntries(
				Array.from(resourceSummaryMap.entries()).map(([key, summary]) => {
					const page = pageDictionary[summary.url];

					if (!page) {
						throw new Error('No page data found for the corresponding URL');
					}

					const packages = Object.keys(resourceIdByPackageName);
					const integrations =
						page.category === 'package' || page.category === 'repository'
							? getIntegrations(
									page.configs ?? [],
									packages,
									page.dependencies ?? {},
							  )
							: getIntegrationsFromPage(page, packages);
					const resource: Resource = {
						...summary,
						category: page.category,
						author: page.author,
						title: page.title,
						description: page.description,
						image: page.image,
						video: page.video,
						isSafe: page.isSafe,
						dependencies: page.dependencies,
						configs: page.configs,
						viewCount: page.viewCount,
						bookmarkUsers: page.bookmarkUsers,
						integrations,
					};

					return [summary.id, resource];
				}),
			);
		},
		async submit(userId: string, url: string) {
			let status: SubmissionStatus | null = null;
			let page = await pageStore.getOrCreatePage(url);

			if (!page.isSafe) {
				return {
					id: null,
					status: 'INVALID',
				};
			}

			let id = resourceIdByURL[page.url] ?? null;

			if (!id) {
				const result = await createResource(page, userId);

				id = result.id;
				status = result.status;

				if (id) {
					resourceIdByURL[page.url] = id;
					storage.put('index/URL', resourceIdByURL);
				}
			} else {
				status = 'RESUBMITTED';
			}

			return { id, status };
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

export function getResourceStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
) {
	const { CONTENT, RESOURCES_STORE } = env;
	const fetchStore = createStoreFetch(RESOURCES_STORE, 'resources');
	const storeName = '';

	return {
		async list(): Promise<{ [resourceId: string]: Resource }> {
			let data = await CONTENT.get<{ [resourceId: string]: Resource }>(
				'guides/news',
				'json',
			);

			if (!data) {
				data = await fetchStore(storeName, '/resources', 'GET');

				ctx.waitUntil(
					CONTENT.put('guides/news', JSON.stringify(data), {
						expirationTtl: 3600,
					}),
				);
			}

			return data ?? {};
		},
		async submit(
			url: string,
			userId: string,
		): Promise<{ id: string; status: SubmissionStatus }> {
			const { id, status } = await fetchStore(storeName, '/submit', 'POST', {
				url,
				userId,
			});

			if (status === 'PUBLISHED') {
				await CONTENT.delete('guides/news');
			}

			return {
				id,
				status,
			};
		},
		async backup(): Promise<Record<string, any>> {
			return await fetchStore(storeName, '/backup', 'POST');
		},
		async restore(data: Record<string, any>): Promise<void> {
			return await fetchStore(storeName, '/restore', 'POST', data);
		},
	};
}

/**
 * ResourcesStore - A durable object that keeps resources data and preview info
 */
export class ResourcesStore {
	env: Env;
	state: DurableObjectState;
	store: AsyncReturnType<typeof createResourceStore> | null;

	constructor(state: DurableObjectState, env: Env) {
		this.env = env;
		this.state = state;
		this.store = null;
		state.blockConcurrencyWhile(async () => {
			this.store = await createResourceStore(state, env);
		});
	}

	async fetch(request: Request) {
		let logger = createLogger(request, this.env);
		let response = new Response('Not found', { status: 404 });

		try {
			const url = new URL(request.url);
			const method = request.method.toUpperCase();

			if (!this.store) {
				throw new Error(
					'The store object is unavailable; Please check if the store is initialised properly',
				);
			} else if (url.pathname === '/resources' && method === 'GET') {
				const result = await this.store.list();

				response = json(result);
			} else if (url.pathname === '/submit' && method === 'POST') {
				const { url, userId } = await request.json();
				const result = await this.store.submit(userId, url);

				response = json(result, 201);
			} else if (url.pathname === '/backup' && method === 'POST') {
				const data = await this.store.backup();

				response = json(data);
			} else if (url.pathname === '/restore' && method === 'POST') {
				const data = await request.json<any>();

				await this.store.restore(data);

				// Re-initialise everything again
				this.store = await createResourceStore(this.state, this.env);

				response = new Response(null, { status: 204 });
			}
		} catch (e) {
			console.log('error', e);
			if (e instanceof Error) {
				logger.error(e);
				logger.log(
					`ResourcesStore failed while handling fetch - ${request.url}; Received message: ${e.message}`,
				);
			}

			response = new Response('Internal Server Error', { status: 500 });
		} finally {
			logger.report(response);
		}

		return response;
	}
}
