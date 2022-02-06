import type {
	Env,
	Resource,
	ResourceMetadata,
	SearchOptions,
	SubmissionStatus,
} from '../types';
import { matchCache, updateCache, removeCache } from '../cache';
import { getUserStore } from '../store/UserStore';
import { search } from '~/resources';

export type Store = ReturnType<typeof createStore>;

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
	const id = env.RESOURCES_STORE.idFromName('');
	const resourcesStore = env.RESOURCES_STORE.get(id);

	async function listResources(): Promise<ResourceMetadata[]> {
		let list = await matchCache<ResourceMetadata[]>('resources');

		if (!list) {
			const result = await env.CONTENT.list<ResourceMetadata>({
				prefix: 'resources/',
			});

			list = result.keys.flatMap((key) => key.metadata ?? []);

			ctx.waitUntil(updateCache('resources', list, 300));
		}

		return list;
	}

	return {
		async search(userId?: string | null, options?: SearchOptions) {
			try {
				const [list, includes] = await Promise.all([
					listResources(),
					options && options.list !== null
						? (async () => {
								const user = userId
									? await getUserStore(env, ctx).getUser(userId)
									: null;

								switch (options.list) {
									case 'bookmarks':
										return user?.bookmarked ?? [];
									case 'history':
										return user?.viewed ?? [];
									default:
										return null;
								}
						  })()
						: null,
				]);

				return search(list, { ...options, includes });
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async query(resourceId: string) {
			try {
				let resource = await matchCache<Resource>(`resources/${resourceId}`);

				if (!resource) {
					resource = await env.CONTENT.get<Resource>(
						`resources/${resourceId}`,
						'json',
					);

					if (!resource) {
						const response = await resourcesStore.fetch(
							`http://resources/details?resourceId=${resourceId}`,
							{ method: 'GET' },
						);

						resource = response.ok ? await response.json() : null;
					}

					if (resource) {
						ctx.waitUntil(
							updateCache(`resources/${resourceId}`, resource, 300),
						);
					}
				}

				return resource;
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async submit(
			url: string,
			userId: string,
		): Promise<{ id: string; status: SubmissionStatus }> {
			try {
				const response = await resourcesStore.fetch('http://resources/submit', {
					method: 'POST',
					body: JSON.stringify({ url, userId }),
				});

				if (!response.ok) {
					throw new Error('Fail submitting the resource');
				}

				const { id, status } = await response.json();

				if (status === 'PUBLISHED') {
					ctx.waitUntil(removeCache('resources'));
				}

				return {
					id,
					status,
				};
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async refresh(userId: string, resourceId: string): Promise<void> {
			try {
				const response = await resourcesStore.fetch(
					'http://resources/refresh',
					{
						method: 'POST',
						body: JSON.stringify({ resourceId, userId }),
					},
				);

				if (!response.ok) {
					throw new Error(
						'Refresh failed; Resource is not updated on the ResourcesStore',
					);
				}

				ctx.waitUntil(removeCache(`resources/${resourceId}`));
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async backupResources(): Promise<any> {
			try {
				const response = await resourcesStore.fetch('http://resources/backup', {
					method: 'POST',
				});

				if (!response.ok) {
					throw new Error(
						`Backup resources failed; ResourcesStore rejected with ${response.status} ${response.statusText}`,
					);
				}

				return await response.json();
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async restoreResources(data: Record<string, any>): Promise<void> {
			try {
				const response = await resourcesStore.fetch(
					'http://resources/restore',
					{
						method: 'POST',
						body: JSON.stringify(data),
					},
				);

				if (!response.ok) {
					throw new Error(
						`Restore resources failed; ResourcesStore rejected with ${response.status} ${response.statusText}`,
					);
				}
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
	};
}
