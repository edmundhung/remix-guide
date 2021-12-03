import { Authenticator } from 'remix-auth/build/authenticator';
import {
  GitHubProfile,
  GitHubStrategy,
} from 'remix-auth/build/strategies/github';
import { createCookieSessionStorage, redirect } from 'remix';

export interface UserProfile {
  email: string;
}

export interface Auth {
  login(): Promise<UserProfile>;
  logout(): Promise<Response>;
  isAuthenticated(): Promise<UserProfile | null>;
}

function getUserProfile(profile: GitHubProfile): UserProfile {
  return {
    email: profile.emails[0].value,
  };
}

export function createAuth<Env>(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Auth {
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
  let authenticator = new Authenticator<UserProfile>(sessionStorage);

  authenticator.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
      },
      async (accessToken, refreshToken, extraParams, profile) =>
        getUserProfile(profile)
    )
  );

  return {
    async login(): Promise<UserProfile> {
      return await authenticator.authenticate('github', request, {
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
