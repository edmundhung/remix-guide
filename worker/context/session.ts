import { Authenticator } from 'remix-auth/build/authenticator';
import { GitHubStrategy } from 'remix-auth/build/strategies/github';
import { createCookieSessionStorage, redirect } from 'remix';
import type { Env, MessageType, UserProfile } from '../types';

export type Session = ReturnType<typeof createSession>;

export function createSession(
  request: Request,
  env: Env,
  ctx: ExecutionContext
) {
  if (
    !env.GITHUB_CLIENT_ID ||
    !env.GITHUB_CLIENT_SECRET ||
    !env.GITHUB_CALLBACK_URL ||
    !env.SESSION_SECERTS
  ) {
    env.LOGGER?.warn(
      'Fail creating the session context; Some env variables are missing'
    );
    return {
      login() {
        return redirect('/');
      },
      logout() {
        return redirect('/');
      },
      isAuthenticated() {
        return null;
      },
      getFlashMessage() {
        return [null, {}];
      },
      commitWithFlashMessage() {
        return {};
      },
    };
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
