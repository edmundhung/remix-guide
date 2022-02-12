import { Authenticator } from 'remix-auth';
import { GitHubStrategy } from 'remix-auth-github';
import { createCookieSessionStorage, redirect } from 'remix';
import type { Env, MessageType, UserProfile } from '../types';
import { getUserStore } from '../store/UserStore';

export type Session = ReturnType<typeof createSession>;

export function createSession(
	request: Request,
	env: Env,
	ctx: ExecutionContext,
) {
	if (!env.SESSION_SECRETS) {
		throw new Error(
			'Fail initialising the session storge; SESSION_SECRETS is missing',
		);
	}

	let sessionStorage = createCookieSessionStorage({
		cookie: {
			name: '__session',
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secrets: env.SESSION_SECRETS.split(','),
			secure: env.GITHUB_CALLBACK_URL?.startsWith('https') ?? false,
		},
	});

	let authenticator = new Authenticator<UserProfile>(sessionStorage);

	if (
		!env.GITHUB_CLIENT_ID ||
		!env.GITHUB_CLIENT_SECRET ||
		!env.GITHUB_CALLBACK_URL
	) {
		throw new Error(
			'Fail initialising the GitHub strategy; Some env variables are missing',
		);
	}

	authenticator.use(
		new GitHubStrategy(
			{
				clientID: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
				callbackURL: env.GITHUB_CALLBACK_URL,
				userAgent: 'remix-guide',
			},
			async ({ profile }) => {
				const userStore = getUserStore(env, profile.id);
				const userProfile: UserProfile = {
					id: profile.id,
					name: profile.displayName,
					email: profile.emails[0].value,
				};

				await userStore.updateProfile(userProfile);

				return userProfile;
			},
		),
	);

	return {
		async login(): Promise<void> {
			const user = await authenticator.authenticate('github', request, {
				failureRedirect: '/',
			});
			const session = await sessionStorage.getSession(
				request.headers.get('cookie'),
			);

			session.set(authenticator.sessionKey, user);

			throw redirect(`/${user.name ?? ''}`, {
				headers: {
					'Set-Cookie': await sessionStorage.commitSession(session),
				},
			});
		},
		async logout(): Promise<void> {
			await authenticator.logout(request, {
				redirectTo: '/',
			});
		},
		async isAuthenticated(): Promise<UserProfile | null> {
			return await authenticator.isAuthenticated(request);
		},
		async getFlashMessage(): Promise<[string | null, Record<string, string>]> {
			const session = await sessionStorage.getSession(
				request.headers.get('Cookie'),
			);
			const message = session.get('message') ?? null;
			const setCookieHeader = !message
				? null
				: {
						'Set-Cookie': await sessionStorage.commitSession(session),
				  };

			return [message, setCookieHeader ?? {}];
		},
		async commitWithFlashMessage(
			message: string,
			type: MessageType = 'info',
		): Promise<Record<string, string>> {
			const session = await sessionStorage.getSession(
				request.headers.get('Cookie'),
			);

			session.flash('message', `${type}: ${message}`);

			return {
				'Set-Cookie': await sessionStorage.commitSession(session),
			};
		},
	};
}
