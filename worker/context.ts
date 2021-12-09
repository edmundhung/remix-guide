import { Authenticator } from 'remix-auth/build/authenticator';
import { GitHubStrategy } from 'remix-auth/build/strategies/github';
import { createCookieSessionStorage, redirect } from 'remix';
import type { Category, Env, Entry, UserProfile } from './types';

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
  categories: Category[] | null;
  authors: string[] | null;
  integrations: string[] | null;
  languages: string[] | null;
}

export function createStore(request: Request, env: Env, ctx: ExecutionContext) {
  const id = env.ENTRIES_STORE.idFromName('');
  const entriesStore = env.ENTRIES_STORE.get(id);

  return {
    async search(options: SearchOptions) {
      const list = await env.CONTENT.list<Metadata>({ prefix: 'entry/' });
      const entries = list.keys.flatMap((key) => key.metadata ?? []);
      const match = (wanted: string[] | null, value: string) => {
        if (!wanted) {
          return true;
        }

        return wanted.length > 0 && wanted.includes(value);
      };
      const result = entries.filter(
        (item) =>
          true &&
          match(options.categories, item.category) &&
          match(options.author, item.author) &&
          match(options.languages, item.language)
        // && item.integrations?.some(integration => match(options.integrations, integration))
      );

      return result;
    },
    async query(id: string) {
      return await env.CONTENT.get<Entry>(`entry/${id}`, 'json');
    },
    async submit(url: string) {
      const body = new URLSearchParams({ url });
      const response = await entriesStore.fetch('http://entries/submit', {
        method: 'POST',
        body,
      });
      const formData = await response.formData();
      const id = formData.get('id');

      if (!id) {
        throw new Error('Submission failed; Entry id is missing');
      }

      return id;
    },
    async refresh(id: string): void {
      // const entry = await ENTRIES.get(hash);
      // if (!entry) {
      //   return;
      // }
      // const page = await preview(url);
      // await entryCache.set(entry.id, {
      //   ...entry,
      //   ...createEntry(entry.id, page),
      // });
    },
    async bookmark(id: string) {
      throw new Error(`bookmark(${id}) is not implemented yet`);
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
