import { Authenticator } from 'remix-auth/build/authenticator';
import { GitHubStrategy } from 'remix-auth/build/strategies/github';
import { createCookieSessionStorage, redirect } from 'remix';
import type {
  Env,
  Entry,
  User,
  MessageType,
  Metadata,
  UserProfile,
  SearchOptions,
  SubmissionStatus,
} from './types';

export type Context = ReturnType<typeof createContext>;

export function createAuth(request: Request, env: Env, ctx: ExecutionContext) {
  if (
    !env.GITHUB_CLIENT_ID ||
    !env.GITHUB_CLIENT_SECRET ||
    !env.GITHUB_CALLBACK_URL ||
    !env.SESSION_SECERTS
  ) {
    throw new Error(
      'Fail creating auth object; Some env variables are missing'
    );
  }

  let sessionStorage = createCookieSessionStorage({
    cookie: {
      name: '__session',
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secrets: env.SESSION_SECERTS.split(','),
      secure: process.env.NODE_ENV === 'production',
    },
  });
  let authenticator = new Authenticator<UserProfile>(sessionStorage, {
    sessionKey: 'user',
  });

  authenticator.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        userAgent: 'remix-guide',
      },
      async (accessToken, refreshToken, extraParams, githubProfile) => {
        const profile: UserProfile = {
          id: githubProfile.id,
          name: githubProfile.displayName,
          email: githubProfile.emails[0].value,
        };

        const id = env.USER_STORE.idFromName(profile.id);
        const store = env.USER_STORE.get(id);
        const response = await store.fetch('http://user/profile', {
          method: 'PUT',
          body: JSON.stringify(profile),
        });

        if (!response.ok) {
          throw new Error('Update user profile failed');
        }

        return profile;
      }
    )
  );

  return {
    async login(): Promise<void> {
      await authenticator.authenticate('github', request, {
        successRedirect: '/',
        failureRedirect: '/',
      });
    },
    async logout(): Promise<Response> {
      const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
      );

      return redirect('/', {
        headers: {
          'Set-Cookie': await sessionStorage.destroySession(session),
        },
      });
    },
    async isAuthenticated(): Promise<UserProfile | null> {
      return await authenticator.isAuthenticated(request);
    },
    async getFlashMessage(): Promise<[string | null, Record<string, string>]> {
      const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
      );
      const message = session.get('message') ?? null;
      const setCookieHeader = !message
        ? {}
        : {
            'Set-Cookie': await sessionStorage.commitSession(session),
          };

      return [message, setCookieHeader];
    },
    async commitWithFlashMessage(
      message: string,
      type: MessageType = 'info'
    ): Promise<Record<string, string>> {
      const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
      );

      session.flash('message', `${type}: ${message}`);

      return {
        'Set-Cookie': await sessionStorage.commitSession(session),
      };
    },
  };
}

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

      const { id, status } = await response.json();

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

      if (!response.ok) {
        throw new Error(
          'Bookmark failed; Entry is not bookmarked on the UserStore'
        );
      }

      ctx.waitUntil(
        entriesStore.fetch('http://entries/bookmark', {
          method: 'PUT',
          body: JSON.stringify({ entryId }),
        })
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
        entriesStore.fetch('http://entries/bookmark', {
          method: 'DELETE',
          body: JSON.stringify({ entryId }),
        })
      );
    },
  };
}

export function createContext(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  return {
    auth: createAuth(request, env, ctx),
    store: createStore(request, env, ctx),
  };
}
