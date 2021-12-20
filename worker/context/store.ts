import type {
  Env,
  User,
  Resource,
  ResourceMetadata,
  SearchOptions,
  SubmissionStatus,
} from '../types';

export type Store = ReturnType<typeof createStore>;

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
  const id = env.RESOURCES_STORE.idFromName('');
  const resourcesStore = env.RESOURCES_STORE.get(id);
  const cache = caches.default as Cache;

  function getUserStore(userId: string) {
    const id = env.USER_STORE.idFromName(userId);
    const store = env.USER_STORE.get(id);

    return store;
  }

  async function getUser(userId: string): Promise<User | null> {
    let user = await matchUserCache(userId);

    if (!user) {
      const userStore = getUserStore(userId);
      const response = await userStore.fetch('http://user/', { method: 'GET' });
      const result = await response.json();

      user = result.user;

      ctx.waitUntil(updateUserCache(userId, user));
    }

    return user;
  }

  function createCacheRequest(key: string): Request {
    return new Request(`http://remix.guide/__cache/${key}`, {
      method: 'GET',
    });
  }

  async function matchUserCache(userId: string): Promise<User | null> {
    const cacheRequest = createCacheRequest(`users/${userId}`);
    const response = await cache.match(cacheRequest);

    if (!response || !response.ok) {
      return null;
    }

    return await response.json();
  }

  async function updateUserCache(userId: string, user: User): Promise<void> {
    const cacheRequest = createCacheRequest(`users/${userId}`);
    const cacheResponse = new Response(JSON.stringify(user), {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=10800',
      },
    });

    await cache.put(cacheRequest, cacheResponse);
  }

  async function removeUserCache(userId: string): Pormise<void> {
    const cacheRequest = createCacheRequest(`users/${userId}`);

    await cache.delete(cacheRequest);
  }

  function getMetadata(resource: Resource): ResourceMetadata {
    return {
      id: resource.id,
      url: resource.url,
      category: resource.category,
      author: resource.author,
      title: resource.title,
      description: resource.description?.slice(0, 80),
      integrations: resource.integrations,
      viewCounts: resource.viewCounts,
      bookmarkCounts: resource.bookmarked.length,
      createdAt: resource.createdAt,
    };
  }

  async function updateResourceCache(resource: Resource): Promise<void> {
    const metadata = getMetadata(resource, []);

    await env.CONTENT.put(
      `resources/${resource.id}`,
      JSON.stringify(resource),
      {
        metadata,
      }
    );
  }

  function match(
    wanted: string[],
    value: string | string[],
    partialMatch = false
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
      const [list, includes] = await Promise.all([
        env.CONTENT.list<ResourceMetadata>({ prefix: 'resources/' }),
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

      const entries = list.keys
        .flatMap((key) => {
          const item = key.metadata;

          if (!item) {
            return [];
          }

          if (includes && !includes.includes(item.id)) {
            return [];
          }

          if (options.excludes && options.excludes.includes(item.id)) {
            return [];
          }

          const isMatching =
            match(
              options?.keyword ? options.keyword.toLowerCase().split(' ') : [],
              `${item.title} ${item.description}`.toLowerCase(),
              true
            ) &&
            match(options.author ? [options.author] : [], item.author) &&
            match(options.category ? [options.category] : [], item.category) &&
            match(
              options.site ? [options.site] : [],
              new URL(item.url).hostname
            ) &&
            match(
              [].concat(options.platform ?? [], options.integrations ?? []),
              item.integrations ?? []
            );

          if (!isMatching) {
            return [];
          }

          return item;
        })
        .sort((prev, next) => {
          switch (options.sortBy) {
            case 'hotness': {
              let diff;

              for (const key of ['bookmarkCounts', 'viewCounts', 'createdAt']) {
                switch (key) {
                  case 'createdAt':
                    diff = new Date(next.createdAt) - new Date(prev.createdAt);
                    break;
                  case 'bookmarkCounts':
                    diff = next.bookmarkCounts - prev.bookmarkCounts;
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
                return new Date(next.createdAt) - new Date(prev.createdAt);
              }
            }
          }
        });

      if (options.limit) {
        return entries.slice(0, options.limit);
      }

      return entries;
    },
    async query(resourceId: string) {
      return await env.CONTENT.get<Resource>(`resources/${resourceId}`, 'json');
    },
    async getUser(userId: string) {
      return await getUser(userId);
    },
    async submit(
      url: string,
      category: string,
      userId: string
    ): Promise<{ id: string; status: SubmissionStatus }> {
      const response = await resourcesStore.fetch('http://resources/submit', {
        method: 'POST',
        body: JSON.stringify({ url, category, userId }),
      });

      if (!response.ok) {
        throw new Error('Fail submitting the resource');
      }

      const { id, resource, status } = await response.json();

      if (resource) {
        await updateResourceCache(resource);
      }

      return {
        id,
        status,
      };
    },
    async refresh(resourceId: string): Promise<void> {
      const response = await resourcesStore.fetch('http://resources/refresh', {
        method: 'POST',
        body: JSON.stringify({ resourceId }),
      });

      if (!response.ok) {
        throw new Error(
          'View failed; Resource is not marked as viewed on the UserStore'
        );
      }
    },
    async view(userId: string | null, resourceId: string): Promise<void> {
      if (userId) {
        const userStore = getUserStore(userId);
        const response = await userStore.fetch('http://user/view', {
          method: 'PUT',
          body: JSON.stringify({ userId, resourceId }),
        });

        if (!response.ok) {
          throw new Error(
            'View failed; Resource is not marked as viewed on the UserStore'
          );
        }
      }

      ctx.waitUntil(removeUserCache(userId));
      ctx.waitUntil(
        resourcesStore.fetch('http://resources/view', {
          method: 'PUT',
          body: JSON.stringify({ resourceId }),
        })
      );
    },
    async bookmark(userId: string, resourceId: string): Promise<void> {
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
          'Bookmark failed; Resource is not bookmarked on the UserStore'
        );
      }

      ctx.waitUntil(removeUserCache(userId));
      ctx.waitUntil(
        (async () => {
          const response = await resourcesStore.fetch(
            'http://resources/bookmark',
            {
              method: 'PUT',
              body: JSON.stringify({ userId, resourceId }),
            }
          );
          const { resource } = await response.json();

          await updateResourceCache(resource);
        })()
      );
    },
    async unbookmark(userId: string, resourceId: string): Promise<void> {
      const userStore = getUserStore(userId);
      const response = await userStore.fetch('http://user/bookmark', {
        method: 'DELETE',
        body: JSON.stringify({ userId, resourceId }),
      });

      if (!response.ok) {
        throw new Error(
          'Unbookmark failed; Resource is not unbookmarked on the UserStore'
        );
      }

      ctx.waitUntil(removeUserCache(userId));
      ctx.waitUntil(
        (async () => {
          const response = await resourcesStore.fetch(
            'http://resources/bookmark',
            {
              method: 'DELETE',
              body: JSON.stringify({ userId, resourceId }),
            }
          );
          const { resource } = await response.json();

          await updateResourceCache(resource);
        })()
      );
    },
  };
}
