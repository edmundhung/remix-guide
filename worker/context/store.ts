import type {
	Env,
	User,
	Resource,
	ResourceMetadata,
	SearchOptions,
	SubmissionStatus,
	UserProfile,
} from '../types';
import { matchCache, updateCache, removeCache } from '../cache';
import { getUserStore } from '../store/UserStore';

export type Store = ReturnType<typeof createStore>;

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
	const id = env.RESOURCES_STORE.idFromName('');
	const resourcesStore = env.RESOURCES_STORE.get(id);

	async function getUser(userId: string): Promise<User | null> {
		let user = await matchCache<User>(`users/${userId}`);

		if (!user) {
			const userStore = getUserStore(env, userId);

			user = await userStore.getUser();

			if (user) {
				ctx.waitUntil(updateCache(`users/${userId}`, user, 10800));
			}
		}

		return user;
	}

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

	async function listUserProfiles(): Promise<UserProfile[]> {
		let list = await matchCache<UserProfile[]>('users');

		if (!list) {
			const result = await env.CONTENT.list<UserProfile>({
				prefix: 'user/',
			});

			list = result.keys.flatMap((key) => key.metadata ?? []);

			ctx.waitUntil(updateCache('users', list, 60));
		}

		return list;
	}

	function match(
		wanted: string[],
		value: string | string[],
		partialMatch = false,
	) {
		if (wanted.length === 0) {
			return true;
		}

		if (partialMatch || Array.isArray(value)) {
			return wanted.every((item) => value.includes(item));
		}

		return wanted.includes(value);
	}

	return {
		async search(userId: string | null, options: SearchOptions) {
			try {
				const [list, includes] = await Promise.all([
					listResources(),
					options.list !== null
						? (async () => {
								const user = userId ? await getUser(userId) : null;

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

				const entries = list
					.filter((metadata) => {
						if (!metadata) {
							return false;
						}

						if (includes && !includes.includes(metadata.id)) {
							return false;
						}

						if (options.excludes && options.excludes.includes(metadata.id)) {
							return false;
						}

						const isMatching =
							match(
								options?.keyword
									? options.keyword.toLowerCase().split(' ')
									: [],
								`${metadata.title} ${metadata.description}`.toLowerCase(),
								true,
							) &&
							match(options.author ? [options.author] : [], metadata.author) &&
							match(
								options.category ? [options.category] : [],
								metadata.category,
							) &&
							match(
								options.site ? [options.site] : [],
								new URL(metadata.url).hostname,
							) &&
							match(
								[].concat(options.platform ?? [], options.integrations ?? []),
								metadata.integrations ?? [],
							);

						return isMatching;
					})
					.sort((prev, next) => {
						switch (options.sortBy) {
							case 'hotness': {
								let diff;

								for (const key of ['bookmarkCount', 'viewCount', 'createdAt']) {
									switch (key) {
										case 'createdAt':
											diff =
												new Date(next.createdAt).valueOf() -
												new Date(prev.createdAt).valueOf();
											break;
										case 'bookmarkCounts':
											diff =
												(next.bookmarkCount ?? 0) - (prev.bookmarkCount ?? 0);
											break;
										case 'viewCount':
											diff = next.viewCount - prev.viewCount;
											break;
									}

									if (diff !== 0) {
										break;
									}
								}

								return diff;
							}
							default: {
								if (includes) {
									return includes.indexOf(prev.id) - includes.indexOf(next.id);
								} else {
									return (
										new Date(next.createdAt).valueOf() -
										new Date(prev.createdAt).valueOf()
									);
								}
							}
						}
					});

				if (options.limit) {
					return entries.slice(0, options.limit);
				}

				return entries;
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
		async getUser(userId: string) {
			try {
				return await getUser(userId);
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
		async view(userId: string | null, resourceId: string): Promise<void> {
			try {
				if (userId) {
					const userStore = getUserStore(env, userId);

					await userStore.view(userId, resourceId);
				}

				ctx.waitUntil(removeCache(`users/${userId}`));
				ctx.waitUntil(
					resourcesStore.fetch('http://resources/view', {
						method: 'PUT',
						body: JSON.stringify({ resourceId }),
					}),
				);
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async bookmark(userId: string, resourceId: string): Promise<void> {
			try {
				const userStore = getUserStore(env, userId);

				await userStore.bookmark(userId, resourceId);

				ctx.waitUntil(removeCache(`users/${userId}`));
				ctx.waitUntil(
					resourcesStore.fetch('http://resources/bookmark', {
						method: 'PUT',
						body: JSON.stringify({ userId, resourceId }),
					}),
				);
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async unbookmark(userId: string, resourceId: string): Promise<void> {
			try {
				const userStore = getUserStore(env, userId);

				await userStore.unbookmark(userId, resourceId);

				ctx.waitUntil(removeCache(`users/${userId}`));
				ctx.waitUntil(
					resourcesStore.fetch('http://resources/bookmark', {
						method: 'DELETE',
						body: JSON.stringify({ userId, resourceId }),
					}),
				);
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
		async listUsers(): Promise<UserProfile[]> {
			try {
				return await listUserProfiles();
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async backupUser(userId: string): Promise<any> {
			try {
				const userStore = getUserStore(env, userId);

				return await userStore.backup();
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
		async restoreUser(
			userId: string,
			data: Record<string, any>,
		): Promise<void> {
			try {
				const userStore = getUserStore(env, userId);

				await userStore.restore(data);
			} catch (e) {
				env.LOGGER?.error(e);
				throw e;
			}
		},
	};
}
