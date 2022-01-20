import type {
	Env,
	User,
	Resource,
	ResourceMetadata,
	SearchOptions,
	SubmissionStatus,
} from '../types';
import { matchCache, updateCache, removeCache } from '../cache';

export type Store = ReturnType<typeof createStore>;

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
	const id = env.RESOURCES_STORE.idFromName('');
	const resourcesStore = env.RESOURCES_STORE.get(id);

	function getUserStore(userId: string) {
		const id = env.USER_STORE.idFromName(userId);
		const store = env.USER_STORE.get(id);

		return store;
	}

	async function getUser(userId: string): Promise<User | null> {
		let user = await matchCache<User>(`users/${userId}`);

		if (!user) {
			const userStore = getUserStore(userId);
			const response = await userStore.fetch('http://user/', { method: 'GET' });
			const result = await response.json();

			user = result.user;

			ctx.waitUntil(updateCache(`users/${userId}`, user, 10800));
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

								for (const key of [
									'bookmarkCounts',
									'viewCounts',
									'createdAt',
								]) {
									switch (key) {
										case 'createdAt':
											diff =
												new Date(next.createdAt).valueOf() -
												new Date(prev.createdAt).valueOf();
											break;
										case 'bookmarkCounts':
											diff =
												(next.bookmarkCounts ?? 0) - (prev.bookmarkCounts ?? 0);
											break;
										case 'viewCounts':
											diff = next.viewCounts - prev.viewCounts;
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
			category: string,
			userAgent: string,
			userId: string,
		): Promise<{ id: string; status: SubmissionStatus }> {
			try {
				const response = await resourcesStore.fetch('http://resources/submit', {
					method: 'POST',
					body: JSON.stringify({ url, category, userAgent, userId }),
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
		async refresh(
			userId: string,
			resourceId: string,
			userAgent: string,
		): Promise<void> {
			try {
				const response = await resourcesStore.fetch(
					'http://resources/refresh',
					{
						method: 'POST',
						body: JSON.stringify({ resourceId, userId, userAgent }),
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
					const userStore = getUserStore(userId);
					const response = await userStore.fetch('http://user/view', {
						method: 'PUT',
						body: JSON.stringify({ userId, resourceId }),
					});

					if (!response.ok) {
						throw new Error(
							'View failed; Resource is not marked as viewed on the UserStore',
						);
					}
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
				const userStore = getUserStore(userId);
				const response = await userStore.fetch('http://user/bookmark', {
					method: 'PUT',
					body: JSON.stringify({ userId, resourceId }),
				});

				if (response.status === 409) {
					/**
					 * If the action is conflicting with the current status
					 * It is very likely a tempoary problem with data consistency
					 * There is no need to let the user know as the result fulfills the original intention anyway
					 */
					return;
				}

				if (!response.ok) {
					throw new Error(
						'Bookmark failed; Resource is not bookmarked on the UserStore',
					);
				}

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
				const userStore = getUserStore(userId);
				const response = await userStore.fetch('http://user/bookmark', {
					method: 'DELETE',
					body: JSON.stringify({ userId, resourceId }),
				});

				if (!response.ok) {
					throw new Error(
						'Unbookmark failed; Resource is not unbookmarked on the UserStore',
					);
				}

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
	};
}
