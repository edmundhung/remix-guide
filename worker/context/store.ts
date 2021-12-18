import type {
  Env,
  Entry,
  User,
  Metadata,
  SearchOptions,
  SubmissionStatus,
} from './types';

export type Store = ReturnType<typeof createStore>;

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
  const id = env.ENTRIES_STORE.idFromName('');
  const entriesStore = env.ENTRIES_STORE.get(id);

  function getUserStore(userId: string) {
    const id = env.USER_STORE.idFromName(userId);
    const store = env.USER_STORE.get(id);

    return store;
  }

  async function getUser(userId: string): Promise<User | null> {
    const userStore = getUserStore(userId);
    const response = await userStore.fetch('http://user/', { method: 'GET' });
    const { user } = await response.json();

    return user;
  }

  function getMetadata(entry: Entry): Metadata {
    return {
      id: entry.id,
      url: entry.url,
      category: entry.category,
      author: entry.author,
      title: entry.title,
      description: entry.description,
      integrations: entry.integrations,
      viewCounts: entry.viewCounts,
      bookmarkCounts: entry.bookmarkCounts,
      createdAt: entry.createdAt,
    };
  }

  async function updateEntryCache(entry: Entry): Promise<void> {
    const metadata = getMetadata(entry, []);

    await env.CONTENT.put(`entry/${entry.id}`, JSON.stringify(entry), {
      metadata,
    });
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
        env.CONTENT.list<Metadata>({ prefix: 'entry/' }),
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
            match(options.categories ?? [], item.category) &&
            match(
              options.hostname ? [options.hostname] : [],
              new URL(item.url).hostname
            ) &&
            match(options.integrations ?? [], item.integrations ?? []);

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
    async query(entryId: string) {
      return await env.CONTENT.get<Entry>(`entry/${entryId}`, 'json');
    },
    async getUser(userId: string) {
      return await getUser(userId);
    },
    async submit(
      url: string,
      category: string,
      userId: string
    ): Promise<{ id: string; status: SubmissionStatus }> {
      const response = await entriesStore.fetch('http://entries/submit', {
        method: 'POST',
        body: JSON.stringify({ url, category, userId }),
      });

      const { id, entry, status } = await response.json();

      if (entry) {
        await updateEntryCache(entry);
      }

      return {
        id,
        status,
      };
    },
    async refresh(entryId: string): Promise<void> {
      const response = await entriesStore.fetch('http://entries/refresh', {
        method: 'POST',
        body: JSON.stringify({ entryId }),
      });

      if (!response.ok) {
        throw new Error(
          'View failed; Entry is not marked as viewed on the UserStore'
        );
      }
    },
    async view(userId: string | null, entryId: string): Promise<void> {
      if (userId) {
        const userStore = getUserStore(userId);
        const response = await userStore.fetch('http://user/view', {
          method: 'PUT',
          body: JSON.stringify({ userId, entryId }),
        });

        if (!response.ok) {
          throw new Error(
            'View failed; Entry is not marked as viewed on the UserStore'
          );
        }
      }

      ctx.waitUntil(
        entriesStore.fetch('http://entries/view', {
          method: 'PUT',
          body: JSON.stringify({ entryId }),
        })
      );
    },
    async bookmark(userId: string, entryId: string): Promise<void> {
      const userStore = getUserStore(userId);
      const response = await userStore.fetch('http://user/bookmark', {
        method: 'PUT',
        body: JSON.stringify({ userId, entryId }),
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
          'Bookmark failed; Entry is not bookmarked on the UserStore'
        );
      }

      ctx.waitUntil(
        (async () => {
          const response = await entriesStore.fetch('http://entries/bookmark', {
            method: 'PUT',
            body: JSON.stringify({ entryId }),
          });
          const { entry } = await response.json();

          await updateEntryCache(entry);
        })()
      );
    },
    async unbookmark(userId: string, entryId: string): Promise<void> {
      const userStore = getUserStore(userId);
      const response = await userStore.fetch('http://user/bookmark', {
        method: 'DELETE',
        body: JSON.stringify({ userId, entryId }),
      });

      if (!response.ok) {
        throw new Error(
          'Unbookmark failed; Entry is not unbookmarked on the UserStore'
        );
      }

      ctx.waitUntil(
        (async () => {
          const response = await entriesStore.fetch('http://entries/bookmark', {
            method: 'DELETE',
            body: JSON.stringify({ entryId }),
          });
          const { entry } = await response.json();

          await updateEntryCache(entry);
        })()
      );
    },
  };
}
