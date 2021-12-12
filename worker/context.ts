import { Authenticator } from 'remix-auth/build/authenticator';
import { GitHubStrategy } from 'remix-auth/build/strategies/github';
import { createCookieSessionStorage, redirect } from 'remix';
import type { Category, Env, Entry, User, UserProfile } from './types';
import { Metadata } from '~/types';

export type Context = ReturnType<typeof createContext>;

export function createAuth(request: Request, env: Env, ctx: ExecutionContext) {
  if (process.env.NODE_ENV === 'production') {
    return {
      async login() {
        return redirect('/');
      },
      async logout() {
        return redirect('/');
      },
      async isAuthenticated() {
        return null;
      },
    };
  }

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
  };
}

interface SearchOptions {
  keyword: string;
  list: 'bookmarks' | 'history' | null;
  categories: Category[] | null;
  authors: string[] | null;
  integrations: string[] | null;
  languages: string[] | null;
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
    return await env.CONTENT.get<User>(`user/${userId}`, 'json');
  }

  return {
    async search(userId: string | null, options: SearchOptions) {
      const list = await env.CONTENT.list<Metadata>({ prefix: 'entry/' });
      let entries = list.keys
        .flatMap((key) => key.metadata ?? [])
        .sort(
          (prev, next) => new Date(next.createdAt) - new Date(prev.createdAt)
        );

      if (options.list !== null) {
        const user = userId ? await getUser(userId) : null;

        switch (options.list) {
          case 'bookmarks':
            entries = !user
              ? []
              : entries
                  .filter((entry) => user.bookmarked.includes(entry.id))
                  .sort(
                    (prev, next) =>
                      user.bookmarked.indexOf(prev.id) -
                      user.bookmarked.indexOf(next.id)
                  );
            break;
          case 'history':
            entries = !user
              ? []
              : entries
                  .filter((entry) => user.viewed.includes(entry.id))
                  .sort(
                    (prev, next) =>
                      user.viewed.indexOf(prev.id) -
                      user.viewed.indexOf(next.id)
                  );
            break;
        }
      }

      const match = (wanted: string[], value: string | string[]) => {
        if (wanted.length === 0) {
          return true;
        }

        if (Array.isArray(value)) {
          return wanted.every((item) => value.includes(item));
        }

        return wanted.includes(value);
      };
      const result = entries.filter(
        (item) =>
          true &&
          match(options.categories ?? [], item.category) &&
          match(options.integrations ?? [], item.integrations ?? [])
      );

      return result;
    },
    async query(entryId: string) {
      return await env.CONTENT.get<Entry>(`entry/${entryId}`, 'json');
    },
    async getUser(userId: string) {
      return await getUser(userId);
    },
    async submit(userId: string, url: string) {
      const response = await entriesStore.fetch('http://entries/submit', {
        method: 'POST',
        body: JSON.stringify({ userId, url }),
      });
      const { id } = await response.json();

      if (!id) {
        throw new Error('Submission failed; Entry id is missing');
      }

      return id;
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
