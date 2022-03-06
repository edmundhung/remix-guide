import type { Miniflare } from 'miniflare';
import type { Page } from 'playwright-core';
import type { MockAgent } from 'undici';
import { createCookie } from '@remix-run/server-runtime';
import { sign, unsign } from '@remix-run/node/cookieSigning';
import { queries, getDocument } from '@playwright-testing-library/test';
import type { Resource } from '../worker/types';
import { createStoreFetch } from '../worker/utils';

/**
 * Simulate installGlobals from remix
 * Required for createCookie
 */
global.sign = sign;
global.unsign = unsign;

export async function setSessionCookie(value: any) {
	const cookie = createCookie('__session', {
		httpOnly: true,
		path: '/',
		sameSite: 'lax',
		secrets: ['ReMixGuIDe'],
		secure: false,
	});

	return await cookie.serialize(value);
}

export async function login(
	page: Page,
	mockAgent: MockAgent,
	name = 'edmundhung',
) {
	const $document = await getDocument(page);
	const loginButton = await queries.findByText($document, /Login with GitHub/i);

	const github = mockAgent.get('https://github.com');
	const githubAPI = mockAgent.get('https://api.github.com');

	github
		.intercept({
			path: '/login/oauth/access_token',
			method: 'POST',
		})
		.reply(
			200,
			new URLSearchParams({
				access_token: 'a-platform-for-sharing-everything-about-remix',
				scope: 'emails',
				token_type: 'bearer',
			}).toString(),
		);

	githubAPI
		.intercept({
			path: '/user',
			method: 'GET',
		})
		.reply(200, {
			id: 'dev',
			login: name,
			name: 'Remix Guide Developer',
			email: 'dev@remix.guide',
			avatar_url: null,
		});

	await page.route('/login', async (route) => {
		// There is no way to intercept request in the middle of redirects
		// Which is currently a limitation from the devtool protocol
		// It is also slower if we mock the response after the page is redirected to github login page
		// The current solution completely mock the `/login` route behaviour by setting the state cookie itself

		const url = getPageURL(page);
		const state = 'build-better-website';

		route.fulfill({
			status: 302,
			headers: {
				'Set-Cookie': await setSessionCookie({ 'oauth2:state': state }),
				Location: `${url.origin}/auth?code=remix-guide&state=${state}`,
			},
		});
	});

	await loginButton.click();
}

export async function submitURL(page: Page, url: string) {
	const $form = await page.$('form[action="/submit"]');

	if (!$form) {
		throw new Error('Fail to locate the submission form');
	}

	const input = await queries.findByLabelText(
		$form,
		/Please paste the URL here/i,
	);

	await input.fill(url);

	const submitButton = await queries.findByRole($form, 'button', {
		name: /Submit/i,
	});

	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle' }),
		submitButton.click(),
	]);
}

interface MockGitHubOptions {
	login: string;
	description: string;
	files: string[];
	dependencies: Record<string, string>;
	devDependencies: Record<string, string>;
}

export function mockGitHubMetadata(
	mockAgent: MockAgent,
	repo: string,
	options: Partial<MockGitHubOptions>,
) {
	const branch = 'remix-test-branch';
	const path = '';
	const githubAPI = mockAgent.get('https://api.github.com');
	const githubContent = mockAgent.get('https://raw.githubusercontent.com');

	githubAPI
		.intercept({
			path: `/repos/${repo}`,
			method: 'GET',
		})
		.reply(200, {
			full_name: repo,
			description: options.description,
			owner: {
				login: options.login,
			},
			default_branch: branch,
		});

	githubAPI
		.intercept({
			path: `/repos/${repo}/contents/${path}`,
			method: 'GET',
		})
		.reply(
			200,
			options?.files?.map((name) => ({ name })) ?? [{ name: 'package.json' }],
		);

	githubContent
		.intercept({
			path: `/${repo}/${branch}/package.json`,
			method: 'GET',
		})
		.reply(200, {
			dependencies: options.dependencies ?? {},
			devDependencies: options.devDependencies ?? {},
		});
}

interface MockNpmOptions {
	description: string;
	repositoryURL: string;
}

export function mockNpmMetadata(
	mockAgent: MockAgent,
	packageName: string,
	options?: Partial<MockNpmOptions>,
) {
	const npmRegistry = mockAgent.get('https://registry.npmjs.org');

	npmRegistry
		.intercept({
			path: `/${packageName}`,
			method: 'GET',
		})
		.reply(200, {
			name: packageName,
			description: options?.description,
			repository: options?.repositoryURL
				? {
						type: 'git',
						url: `git+${options.repositoryURL}.git`,
				  }
				: null,
		});
}

export function mockYouTubeMetadata(
	mockAgent: MockAgent,
	videoId: string,
	apiKey: string,
) {
	const youtubeAPI = mockAgent.get('https://youtube.googleapis.com');

	youtubeAPI
		.intercept({
			path: `/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`,
			method: 'GET',
		})
		.reply(200, {});
}

export function mockSafeBrowsingAPI(mockAgent: MockAgent, apiKey: string) {
	const safeBrowsingAPI = mockAgent.get('https://safebrowsing.googleapis.com');

	safeBrowsingAPI
		.intercept({
			path: `/v4/threatMatches:find?key=${apiKey}`,
			method: 'POST',
		})
		.reply(200, {});
}

export function mockPage(
	mockAgent: MockAgent,
	urlText: string,
	options?: { status?: number; head?: string; body?: string; headers?: any },
) {
	const url = new URL(urlText);
	const client = mockAgent.get(url.origin);
	const html = `
        <html>
            <head>${options?.head}</head>
            <body>${options?.body}</body>
        </html>
    `;

	client
		.intercept({
			path: urlText !== url.origin ? urlText.replace(url.origin, '') : '/',
			method: 'GET',
		})
		.reply(options?.status ?? 200, html, {
			headers: options?.headers,
		});

	// Assume it is always safe for now
	mockSafeBrowsingAPI(mockAgent, 'test-google-api-key');
}

export async function getResource(mf: Miniflare, resourceId: string | null) {
	if (!resourceId) {
		return null;
	}

	const resources = await listResources(mf);
	const resource = resources?.[resourceId] ?? null;

	return resource;
}

export async function getPage(mf: Miniflare, url: string) {
	const PAGE_STORE = await mf.getDurableObjectNamespace('PAGE_STORE');
	const fetchStore = createStoreFetch(PAGE_STORE, 'page');
	const page = await fetchStore('global', '/details', 'GET', { url });

	return page;
}

export async function listResources(mf: Miniflare) {
	const content = await mf.getKVNamespace('CONTENT');
	const data = await content.get<{ [resourceId: string]: Resource }>(
		'guides/news',
		'json',
	);

	return data;
}

export function getPageURL(page: Page): URL {
	return new URL(page.url());
}

export function getPageGuide(page: Page): string | null {
	const { pathname } = getPageURL(page);

	if (pathname.startsWith('/admin') || pathname.startsWith('/submit')) {
		return null;
	}

	return pathname.slice(1).split('/')[0];
}

export function getPageResourceId(page: Page): string | null {
	return getPageURL(page).searchParams.get('resourceId');
}
