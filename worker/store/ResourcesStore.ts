import { customAlphabet } from 'nanoid';
import { getIntegrations, getIntegrationsFromPage } from '../scraping';
import type {
	Env,
	Page,
	Resource,
	ResourceSummary,
	SubmissionStatus,
	List,
	Guide,
	GuideMetadata,
} from '../types';
import { configureStore, restoreStoreData } from '../utils';
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
 * Default setup
 */
const defaultLists: List[] = [
	{
		slug: 'official',
		title: 'Official',
	},
	{
		slug: 'packages',
		title: 'Packages',
	},
	{
		slug: 'tutorials',
		title: 'Tutorials',
	},
	{
		slug: 'templates',
		title: 'Templates',
	},
	{
		slug: 'talks',
		title: 'Talks',
	},
	{
		slug: 'examples',
		title: 'Examples',
	},
	{
		slug: 'integrations',
		title: 'Integrations',
	},
];

const { Store, createClient } = configureStore(async (state, env: Env) => {
	const { storage } = state;
	const pageStore = getPageStore(env, state);

	let resourceIdByURL =
		(await storage.get<Record<string, string | undefined>>('index/URL')) ?? {};
	let resourceIdByPackageName =
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
		async list(): Promise<Guide> {
			let [resourceSummaryMap, lists, pageDictionary] = await Promise.all([
				storage.list<ResourceSummary>({ prefix: 'resources/' }),
				storage.get<List[]>('lists'),
				pageStore.list(),
			]);

			if (typeof lists === 'undefined') {
				storage.put<List[]>('lists', defaultLists);
				lists = defaultLists;
			}

			const countByList = {} as { [key in string]?: number };
			const resourceEntries = [] as Array<[string, Resource]>;

			for (const summary of resourceSummaryMap.values()) {
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
					description: summary.description ?? page.description,
					image: page.image,
					video: page.video,
					isSafe: page.isSafe,
					dependencies: page.dependencies,
					configs: page.configs,
					viewCount: page.viewCount,
					bookmarkUsers: page.bookmarkUsers,
					integrations,
				};

				for (const list of summary.lists ?? []) {
					countByList[list] = (countByList[list] ?? 0) + 1;
				}

				resourceEntries.push([summary.id, resource]);
			}

			return {
				value: Object.fromEntries(resourceEntries),
				metadata: {
					timestamp: new Date().toISOString(),
					lists: lists.map((list) => ({
						...list,
						count: countByList[list.slug] ?? 0,
					})),
				},
			};
		},
		async submit(
			userId: string,
			url: string,
		): Promise<{ id: string | null; status: SubmissionStatus | null }> {
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
		async updateBookmark(
			resourceId: string,
			description: string | null,
			lists: string[],
		): Promise<void> {
			const resource = await storage.get<ResourceSummary>(
				`resources/${resourceId}`,
			);

			if (!resource) {
				throw new Error(`Resource (${resourceId}) is not available`);
			}

			await updateResource({
				...resource,
				description,
				lists,
			});
		},
		async deleteBookmark(resourceId: string): Promise<void> {
			const isDeleted = await storage.delete(`resources/${resourceId}`);

			if (isDeleted) {
				resourceIdByURL = Object.fromEntries(
					Object.entries(resourceIdByURL).filter(([, id]) => id !== resourceId),
				);
				resourceIdByPackageName = Object.fromEntries(
					Object.entries(resourceIdByPackageName).filter(
						([, id]) => id !== resourceId,
					),
				);
			}
		},
		async backup(): Promise<Record<string, any>> {
			const data = await storage.list();

			return Object.fromEntries(data);
		},
		async restore(data: Record<string, any>): Promise<void> {
			await restoreStoreData(storage, data);

			resourceIdByURL =
				(await storage.get<Record<string, string | undefined>>('index/URL')) ??
				{};
			resourceIdByPackageName =
				(await storage.get<Record<string, string | undefined>>(
					'index/PackageName',
				)) ?? {};
		},
	};
});

/**
 * ResourcesStore - A durable object that keeps resources data and preview info
 */
export const ResourcesStore = Store;

export function getResourceStore(
	env: Env,
	ctx: ExecutionContext | DurableObjectState,
) {
	const { CONTENT, RESOURCES_STORE } = env;
	const storeName = '';

	function isExpiring(timestamp: string | undefined): boolean {
		if (!timestamp) {
			return true;
		}

		const now = new Date();
		const reference = new Date(timestamp);
		const diff = now.valueOf() - reference.valueOf();

		return diff > 3600 * 1000;
	}

	async function getGuide(name: string): Promise<Guide> {
		const client = createClient(RESOURCES_STORE, name);

		return await client.list();
	}

	async function updateCache(
		name: string,
		guide: Guide['value'],
		metadata: GuideMetadata,
	): Promise<void> {
		await CONTENT.put(`guides/${name}`, JSON.stringify(guide), {
			metadata,
			expirationTtl: 3600 * 24,
		});
	}

	async function getGuideWithCache(name: string): Promise<Guide> {
		let { value, metadata } = await CONTENT.getWithMetadata<
			Guide['value'],
			GuideMetadata
		>('guides/discover', 'json');

		if (!value || !metadata) {
			const data = await getGuide(name);
			value = data.value;
			metadata = data.metadata;

			ctx.waitUntil(updateCache('discover', value, metadata));
		} else if (isExpiring(metadata.timestamp)) {
			ctx.waitUntil(
				(async function () {
					const data = await getGuide(name);

					await updateCache('discover', data.value, data.metadata);
				})(),
			);
		}

		return { value, metadata };
	}

	return {
		async getData(): Promise<Guide> {
			return await getGuideWithCache(storeName);
		},
		async list(): Promise<Guide['value']> {
			let { value } = await getGuideWithCache(storeName);

			return value;
		},
		async updateBookmark(
			resourceId: string,
			description: string | null,
			lists: string[],
		): Promise<void> {
			const client = createClient(RESOURCES_STORE, storeName);

			await client.updateBookmark(
				resourceId,
				description !== '' ? description : null,
				lists,
			);
			await CONTENT.delete('guides/discover');
		},
		async deleteBookmark(resourceId: string): Promise<void> {
			const client = createClient(RESOURCES_STORE, storeName);

			await client.deleteBookmark(resourceId);
			await CONTENT.delete('guides/discover');
		},
		async submit(
			url: string,
			userId: string,
		): Promise<{ id: string | null; status: SubmissionStatus | null }> {
			const client = createClient(RESOURCES_STORE, storeName);

			const { id, status } = await client.submit(userId, url);

			if (status === 'PUBLISHED') {
				await CONTENT.delete('guides/discover');
			}

			return {
				id,
				status,
			};
		},
		async backup(): Promise<Record<string, any>> {
			const client = createClient(RESOURCES_STORE, storeName);

			return await client.backup();
		},
		async restore(data: Record<string, any>): Promise<void> {
			const client = createClient(RESOURCES_STORE, storeName);

			return await client.restore(data);
		},
	};
}
