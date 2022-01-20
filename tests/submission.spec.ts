import { test, expect } from './setup';
import {
	login,
	submitURL,
	mockPage,
	mockGitHubMetadata,
	getResource,
	getPageResourceId,
	mockNpmMetadata,
	getPageURL,
	getPage,
} from './utils';

test.describe.parallel('Permission', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/submit');
	});

	test('fails as a guest', async ({ page, queries, mockAgent }) => {
		const url = 'http://example.com/guest';

		mockPage(mockAgent, url);

		await submitURL(page, url);

		expect(
			await queries.findByText(
				/Please login first before submitting new resources/i,
			),
		).toBeDefined();
	});

	test('fails as a user', async ({ page, queries, mockAgent }) => {
		const url = 'http://example.com/user';

		await login(page, mockAgent, 'github-username');
		await page.goto('/submit');

		mockPage(mockAgent, url);

		await submitURL(page, url);

		expect(
			await queries.findByText(
				/This feature is not enabled on your account yet/i,
			),
		).toBeDefined();
	});

	test('success as an admin', async ({ page, queries, mockAgent }) => {
		const url = 'http://example.com/admin';

		await login(page, mockAgent, 'edmundhung');
		await page.goto('/submit');

		mockPage(mockAgent, url);

		await submitURL(page, url);

		expect(
			await queries.findByText(/The submitted resource is now published/i),
		).toBeDefined();
	});
});

test.describe.parallel('Workflow', () => {
	test.beforeEach(async ({ page, mockAgent }) => {
		await page.goto('/');
		await login(page, mockAgent);
		await page.goto('/submit');
	});

	test('shows error message if the url returns 404', async ({
		page,
		queries,
		mockAgent,
	}) => {
		const url = 'http://example.com/url-not-found';

		mockPage(mockAgent, url, { status: 404 });

		// FIXME: It crash if disabled
		mockAgent.enableNetConnect();

		await submitURL(page, url);

		expect(
			await queries.findByText(
				/Something wrong with the URL; Please try again later/i,
			),
		).toBeDefined();
		expect(getPageURL(page).pathname).toBe('/submit');
	});

	test('shows error message if the url returns 500', async ({
		page,
		queries,
		mockAgent,
	}) => {
		const url = 'http://example.com/url-server-error';

		mockPage(mockAgent, url, { status: 500 });

		// FIXME: It crash if disabled
		mockAgent.enableNetConnect();

		await submitURL(page, url);

		expect(
			await queries.findByText(
				/Something wrong with the URL; Please try again later/i,
			),
		).toBeDefined();
		expect(getPageURL(page).pathname).toBe('/submit');
	});

	test('redirects user to the resources page if success', async ({
		page,
		queries,
		mockAgent,
	}) => {
		const url = 'http://example.com/success';

		mockPage(mockAgent, url, {
			status: 200,
			head: `<title>Test sucess</title>`,
		});

		await submitURL(page, url);

		expect(
			await queries.findByText(/The submitted resource is now published/i),
		).toBeDefined();
		expect(getPageURL(page).pathname).not.toBe('/submit');
	});

	test('redirects user to the resources page if the URL is already submitted', async ({
		page,
		queries,
		mockAgent,
	}) => {
		const url = 'http://example.com/submitted';

		mockPage(mockAgent, url);

		await submitURL(page, url);
		await page.goto('/submit');

		mockPage(mockAgent, url);

		await submitURL(page, url);

		expect(
			await queries.findByText(/A resource with the same url is found/i),
		).toBeDefined();
		expect(getPageURL(page).pathname).not.toBe('/submit');
	});
});

test.describe.parallel('Scraping', () => {
	test.beforeEach(async ({ page, mockAgent }) => {
		await page.goto('/');
		await login(page, mockAgent);
		await page.goto('/submit');
	});

	test('scrapes the URL for basic details', async ({ page, mf, mockAgent }) => {
		const url = 'http://example.com/remix-guide';
		const title = 'test';
		const description = 'abcd';

		mockPage(mockAgent, url, {
			status: 200,
			head: `
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <link rel="canonical" href="${url}" />
      `,
		});

		await submitURL(page, url);

		const pageData = await getPage(mf, url);

		expect(pageData).toMatchObject({
			category: 'others',
			title,
			description,
			image: null,
			url,
		});
	});

	test('scrapes the repository if the hostname is `github.com`', async ({
		page,
		mf,
		mockAgent,
	}) => {
		const url = 'http://github.com/random/repository';

		mockPage(mockAgent, url, {
			head: `
				<title>Test repository</title>
				<meta property="og:description" content="Nothing special" />
			`,
		});
		mockGitHubMetadata(mockAgent, 'random/repository', {
			login: 'tester',
			description: 'Testing description',
			files: ['.foobar', 'package.json'],
			dependencies: {
				remix: '1.0.0',
			},
			devDependencies: {
				secret: '0.0.1',
			},
		});

		await submitURL(page, url, 'examples');

		const pageData = await getPage(mf, url);

		expect(pageData).toMatchObject({
			url,
			category: 'examples',
			title: 'random/repository',
			description: 'Testing description',
			author: 'tester',
			dependencies: {
				remix: '1.0.0',
				secret: '0.0.1',
			},
			configs: ['.foobar', 'package.json'],
		});
	});

	test('scrapes the registry if the hostname is `www.npmjs.com` with pathname starts with `package`', async ({
		page,
		mf,
		mockAgent,
	}) => {
		const url = 'http://www.npmjs.com/package/@someone/example-package';

		mockPage(mockAgent, url);
		mockNpmMetadata(mockAgent, '@someone/example-package', {
			description: 'Package description',
			repositoryURL: 'http://github.com/someone/example-package',
		});
		mockGitHubMetadata(mockAgent, 'someone/example-package', {
			login: 'someone',
			description: 'Repository description',
			files: ['.something', 'package.json'],
			dependencies: {
				unknown: '0.1.0',
			},
		});

		await submitURL(page, url, 'packages');

		const pageData = await getPage(mf, url);

		expect(pageData).toMatchObject({
			url,
			category: 'packages',
			title: '@someone/example-package',
			description: 'Package description',
			author: 'someone',
			dependencies: {
				unknown: '0.1.0',
			},
			configs: ['.something', 'package.json'],
		});
	});

	test('follows redirects when scraping the URL', async ({
		page,
		mf,
		mockAgent,
	}) => {
		const url = 'http://example.com/redirect';
		const target = 'http://example.com/target';

		mockPage(mockAgent, url, {
			status: 303,
			headers: {
				location: 'http://example.com/target',
			},
		});

		mockPage(mockAgent, target);

		await submitURL(page, url);

		const resourceId = getPageResourceId(page);
		const resource = await getResource(mf, resourceId);

		expect(resource).toMatchObject({
			url: target,
		});
	});

	test('revalidate the URL if it is different from the canonical URL', async ({
		page,
		mf,
		mockAgent,
	}) => {
		const url = 'http://example.com/revalidate';
		const homepage = 'http://example.com';

		mockPage(mockAgent, url, {
			head: `
        <title>Revalidate Page</title>
        <link rel="canonical" href="${homepage}" />
      `,
		});

		mockPage(mockAgent, homepage, {
			head: `
        <title>Homepage</title>
        <link rel="canonical" href="${homepage}" />
      `,
		});

		await submitURL(page, url);

		const resourceId = getPageResourceId(page);
		const resource = await getResource(mf, resourceId);

		expect(resource).toMatchObject({
			title: 'Homepage',
			url: new URL(homepage).toString(),
		});
	});

	test('accepts the URL only if it has a non-IP address like hostname', async ({
		page,
		queries,
		mockAgent,
	}) => {
		const url = 'http://1.1.1.1/hello-world';

		mockPage(mockAgent, url);

		await submitURL(page, url);

		expect(await queries.findByText(/Invalid URL provided/i)).toBeDefined();
	});

	test('accepts any url as others', async ({ page, queries, mockAgent }) => {
		const url = 'http://example.com/others';

		mockPage(mockAgent, url, {
			status: 200,
		});

		await submitURL(page, url, 'others');

		expect(
			await queries.findByText(/The submitted resource is now published/i),
		).toBeDefined();
		expect(getPageURL(page).pathname).not.toBe('/submit');
	});
});
