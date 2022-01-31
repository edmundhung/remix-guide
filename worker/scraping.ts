import { decode } from 'html-entities';
import { integrations, platforms } from '~/config';
import type { Env, Page } from './types';

interface Parser {
	setup(htmlRewriter: HTMLRewriter): HTMLRewriter;
	getResult(): string | null;
}

function createAttributeParser(selector: string, attribute: string): Parser {
	let result: string | null = null;

	return {
		setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
			return htmlRewriter.on(selector, {
				element(element) {
					result = element.getAttribute(attribute);
				},
			});
		},
		getResult() {
			return result ? decode(result) : null;
		},
	};
}

function createTextParser(selector: string): Parser {
	let text: string | null = null;

	return {
		setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
			return htmlRewriter.on(selector, {
				text(element) {
					text = (text ?? '') + element.text;
				},
			});
		},
		getResult() {
			return text ? decode(text) : null;
		},
	};
}

function mergeParsers(...parsers: Parser[]): Parser {
	return {
		setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
			return parsers.reduce(
				(rewriter, parser) => parser.setup(rewriter),
				htmlRewriter,
			);
		},
		getResult() {
			let result: string | null = null;

			for (let parser of parsers) {
				result = parser.getResult();

				if (result !== null) {
					break;
				}
			}

			return result;
		},
	};
}

async function parseResponse<T extends { [keys in string]: Parser }>(
	response: Response,
	config: T,
): Record<keyof T, string | null> {
	let htmlRewriter = new HTMLRewriter();

	for (const parser of Object.values(config)) {
		htmlRewriter = parser.setup(htmlRewriter);
	}

	let res = htmlRewriter.transform(response);

	await res.arrayBuffer();

	return Object.fromEntries(
		Object.entries(config).map(([key, parser]) => [key, parser.getResult()]),
	);
}

async function isURLReachable(url: string): Promise<boolean> {
	try {
		const response = await fetch(url, { method: 'GET' });

		return response.ok;
	} catch {
		return false;
	}
}

function isValidCanonicalURL(responseURL: URL, pageURL: URL | null): boolean {
	if (!pageURL) {
		return false;
	}

	// In case the website mistakenly treat canonical url as site URL
	if (responseURL.pathname !== '/' && pageURL.pathname === '/') {
		return false;
	}

	return true;
}

async function scrapeHTML(
	url: string,
	userAgent: string | undefined,
): Promise<Page> {
	const headers = new Headers({ Accept: 'text/html' });

	if (userAgent) {
		headers.set('User-Agent', userAgent);
	}

	const response = await fetch(url, {
		headers,
		redirect: 'follow',
	});

	if (!response.ok) {
		const { hostname, pathname } = new URL(url);

		/**
		 * Bypassing it manually if the request fails
		 */
		switch (hostname) {
			case 'www.youtube.com':
				return {
					url,
				};
			case 'youtu.be':
				return {
					url: `https://www.youtube.com/watch?v=${pathname.slice(1)}`,
				};
		}

		throw new Error(
			`Fail scraping url - ${url}; Recevied ${response.status} ${response.statusText} response`,
		);
	}

	const page = await parseResponse(response, {
		title: mergeParsers(
			createAttributeParser('meta[property="og:title"]', 'content'),
			createAttributeParser('meta[name="twitter:title"]', 'content'),
			createTextParser('head > title'),
		),
		description: mergeParsers(
			createAttributeParser('meta[property="og:description"]', 'content'),
			createAttributeParser('meta[name="twitter:description"]', 'content'),
			createAttributeParser('meta[name="description"]', 'content'),
		),
		image: mergeParsers(
			createAttributeParser('meta[property="og:image"]', 'content'),
			createAttributeParser('meta[name="twitter:image"]', 'content'),
			createAttributeParser('meta[name="image"]', 'content'),
		),
		url: mergeParsers(
			createAttributeParser('link[rel="canonical"]', 'href'),
			createAttributeParser('meta[property="og:url"]', 'content'),
		),
	});

	const now = new Date().toISOString();
	const responseURL = new URL(response.url);
	const pageURL = page.url ? new URL(page.url) : responseURL;

	if (pageURL.hostname !== responseURL.hostname) {
		// This might be casued by a proxy. Scrape again and redriect user to the actual URL
		return await scrapeHTML(pageURL.toString(), userAgent);
	}

	return {
		...page,
		image: page.image && (await isURLReachable(page.image)) ? page.image : null,
		url:
			page.url && isValidCanonicalURL(responseURL, pageURL)
				? page.url
				: response.url,
		createdAt: now,
		updatedAt: now,
	};
}

async function checkSafeBrowsingAPI(
	urls: string[],
	apiKey: string,
): Promise<boolean> {
	const response = await fetch(
		`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
		{
			method: 'POST',
			body: JSON.stringify({
				client: {
					clientId: 'remix-guide',
					clientVersion: process.env.VERSION,
				},
				threatInfo: {
					// Based on https://developers.google.com/safe-browsing/v4/reference/rest/v4/ThreatType
					threatTypes: [
						'THREAT_TYPE_UNSPECIFIED',
						'MALWARE',
						'SOCIAL_ENGINEERING',
						'POTENTIALLY_HARMFUL_APPLICATION',
						'UNWANTED_SOFTWARE',
					],
					// Based on https://developers.google.com/safe-browsing/v4/reference/rest/v4/PlatformType
					platformTypes: ['ANY_PLATFORM', 'PLATFORM_TYPE_UNSPECIFIED'],
					// Based on https://developers.google.com/safe-browsing/v4/reference/rest/v4/ThreatEntryType
					threatEntryTypes: ['URL'],
					threatEntries: urls.map((url) => ({ url })),
				},
			}),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Fail to look up threats of the URLs from the Safe Browsing API; Received ${response.status} ${response.statusText}`,
		);
	}

	const result = await response.json<any>();
	const matches = result?.matches ?? [];

	return matches.length === 0;
}

async function getPackageInfo(packageName: string): Promise<any> {
	const response = await fetch(`https://registry.npmjs.org/${packageName}`);

	if (!response.ok) {
		return null;
	}

	return await response.json();
}

async function getGithubRepositoryMetadata(
	repo: string,
	token: string | undefined,
): Promise<any> {
	const response = await fetch(`https://api.github.com/repos/${repo}`, {
		headers: {
			Accept: 'application/vnd.github.v3+json',
			'User-Agent': 'remix-guide',
			Authorization: token ? `token ${token}` : '',
		},
	});

	if (!response.ok) {
		return null;
	}

	return await response.json();
}

async function getGithubRepositoryFiles(
	repo: string,
	token: string | undefined,
	path = '',
): Promise<any[]> {
	const response = await fetch(
		`https://api.github.com/repos/${repo}/contents/${path}`,
		{
			headers: {
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'remix-guide',
				Authorization: token ? `token ${token}` : '',
			},
		},
	);

	if (!response.ok) {
		return [];
	}

	return await response.json();
}

async function getGithubRepositoryPackacgeJSON(
	repo: string,
	branch: string,
): Promise<any> {
	const response = await fetch(
		`https://raw.githubusercontent.com/${repo}/${branch}/package.json`,
	);

	if (!response.ok) {
		return null;
	}

	return await response.json();
}

async function getYouTubeMetadata(
	videoId: string,
	apiKey: string,
): Promise<any> {
	const response = await fetch(
		`https://youtube.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`,
	);

	if (!response.ok) {
		return null;
	}

	return await response.json();
}

function getIntegrations(
	files: string[],
	packages: string[],
	dependencies: Record<string, string>,
): string[] {
	let integrations = new Set<string>();

	for (const packageName of Object.keys(dependencies)) {
		if (packageName === 'remix' || packageName.startsWith('@remix-run/')) {
			integrations.add('remix');
		}

		if (
			packages
				.concat(['cypress', 'tailwindcss', 'prisma', 'express'])
				.includes(packageName)
		) {
			integrations.add(packageName);
		}

		switch (packageName) {
			case '@remix-run/architect':
				integrations.add('architect');
				break;
			case '@azure/functions':
				integrations.add('azure');
				break;
			case '@remix-run/cloudflare-workers':
			case '@remix-run/cloudflare-pages':
			case '@cloudflare/workers-types':
			case '@cloudflare/wrangler':
				integrations.add('cloudflare');
				break;
			case '@remix-run/express':
				integrations.add('express');
				break;
			case 'firebase':
			case 'firebase-admin':
				integrations.add('firebase');
				break;
			case '@remix-run/netlify':
				integrations.add('netlify');
				break;
			case 'vercel':
			case '@vercel/node':
			case '@remix-run/vercel':
				integrations.add('vercel');
				break;
		}
	}

	for (const file of files) {
		switch (file) {
			case 'wrangler.toml':
				integrations.add('cloudflare');
				break;
			case 'fly.toml':
				integrations.add('fly');
				break;
			case 'netlify.toml':
				integrations.add('netlify');
				break;
			case 'vercel.json':
				integrations.add('vercel');
				break;
			case 'firebase.json':
			case '.firebaserc':
				integrations.add('firebase');
				break;
		}
	}

	return Array.from(integrations);
}

async function parseGithubRepository(
	repo: string,
	token: string | undefined,
): Promise<Partial<Page> | null> {
	const [metadata, files] = await Promise.all([
		getGithubRepositoryMetadata(repo, token),
		getGithubRepositoryFiles(repo, token),
	]);

	if (!metadata) {
		return null;
	}

	const configs = files.map((file) => file.name);
	const packageJSON = configs.find((name) => name === 'package.json')
		? await getGithubRepositoryPackacgeJSON(repo, metadata['default_branch'])
		: null;

	return {
		title: metadata['full_name'],
		category: 'repository',
		description: metadata['description'],
		author: metadata['owner']?.['login'],
		dependencies: {
			...packageJSON?.dependencies,
			...packageJSON?.devDependencies,
		},
		configs,
	};
}

async function parseNpmPackage(
	packageName: string,
	githubToken: string | undefined,
): Promise<Partial<Page> | null> {
	const info = await getPackageInfo(packageName);

	if (!info) {
		return null;
	}

	const [, ...names] =
		info['repository']?.type === 'git'
			? new URL(
					info['repository'].url.replace(/^git\+/, '').replace(/\.git$/, ''),
			  ).pathname.split('/', 3)
			: [];

	const details =
		names.length === 2
			? await parseGithubRepository(names.join('/'), githubToken)
			: null;

	return {
		...details,
		category: 'package',
		title: info.name,
		description: info.description,
	};
}

async function parseYouTubeVideo(videoId: string, apiKey: string | undefined) {
	if (!apiKey) {
		return null;
	}

	const metadata = await getYouTubeMetadata(videoId, apiKey);

	if (!metadata) {
		return null;
	}

	const [video] = metadata.items ?? [];
	const { title, description, thumbnails } = video?.snippet ?? {};

	return {
		title,
		description,
		image:
			thumbnails?.standard?.url ??
			thumbnails?.high?.url ??
			thumbnails?.medium?.url ??
			null,
		video: `https://www.youtube.com/embed/${videoId}`,
	};
}

function getIntegrationsFromPage(page: Page, packages: string[]): string[] {
	const result = new Set<string>();
	const tokens = ([] as string[])
		.concat(page.title ?? [], page.description ?? [])
		.join(' ')
		.toLowerCase()
		.match(/[a-z-0-9]+/gi);

	if (tokens) {
		for (const keyword of [...packages, ...integrations, ...platforms]) {
			if (tokens.includes(keyword)) {
				result.add(keyword);
			}
		}
	}

	return Array.from(result);
}

async function getPageDetails(
	url: string,
	env: Env,
): Promise<Partial<Page> | null> {
	const { hostname, pathname, searchParams } = new URL(url);

	let details: Partial<Page> | null = null;

	if (hostname === 'www.npmjs.com' && pathname.startsWith('/package/')) {
		details = await parseNpmPackage(
			pathname.replace('/package/', ''),
			env.GITHUB_TOKEN,
		);
	} else if (
		hostname === 'github.com' &&
		pathname.slice(1).split('/').length === 2
	) {
		details = await parseGithubRepository(pathname.slice(1), env.GITHUB_TOKEN);
	} else if (hostname === 'gist.github.com') {
		const [author] = pathname.slice(1).split('/');

		details = {
			author,
			description: '',
		};
	} else if (hostname === 'www.youtube.com' && searchParams.has('v')) {
		details = await parseYouTubeVideo(
			searchParams.get('v') as string,
			env.GOOGLE_API_KEY,
		);
	}

	if (details !== null) {
		details = Object.fromEntries(
			Object.entries(details).filter(
				([, value]) => typeof value !== 'undefined',
			),
		);
	}

	return {
		...details,
		category: details?.category ?? 'others',
	};
}

export {
	scrapeHTML,
	getPageDetails,
	getIntegrations,
	getIntegrationsFromPage,
	checkSafeBrowsingAPI,
};
