import { test, expect } from './setup';
import {
  submitURL,
  mockPage,
  mockGitHubMetadata,
  getResource,
  getPageResourceId,
  mockNpmMetadata,
} from './utils';

test.describe.parallel('Permission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/submit');
  });

  test('fails as a guest', async ({ page, baseURL, queries }) => {
    await submitURL(page, `${baseURL}`);

    expect(
      await queries.findByText(
        /Please login first before submitting new resources/i
      )
    ).toBeDefined();
  });

  test('fails as a user', async ({ page, baseURL, queries, login }) => {
    await login('github-username');
    await page.goto('/submit');
    await submitURL(page, `${baseURL}`);

    expect(
      await queries.findByText(
        /This feature is not enabled on your account yet/i
      )
    ).toBeDefined();
  });

  test('success as an admin', async ({ page, baseURL, queries, login }) => {
    await login('edmundhung');
    await page.goto('/submit');
    await submitURL(page, `${baseURL}`);

    expect(
      await queries.findByText(/The submitted resource is now published/i)
    ).toBeDefined();
  });
});

test.describe.parallel('Workflow', () => {
  test.beforeEach(async ({ page, login }) => {
    await page.goto('/');
    await login('edmundhung');
    await page.goto('/submit');
  });

  test('shows error message if the url returns 404', async ({
    page,
    queries,
    mockAgent,
  }) => {
    const url = 'http://example.com/url-not-found';

    mockPage(mockAgent, url, {
      status: 404,
      head: `
        <meta property="og:title" content="Oops" />
        <meta property="og:description" content="Not Found" />
        <link rel="canonical" href="${url}" />
      `,
    });

    await submitURL(page, url);

    expect(
      await queries.findByText(
        /Something wrong with the URL; Please try again later/i
      )
    ).toBeDefined();
    expect(new URL(page.url()).pathname).toBe('/submit');
  });

  test('shows error message if the url returns 500', async ({
    page,
    queries,
    mockAgent,
  }) => {
    const url = 'http://example.com/url-server-error';

    mockPage(mockAgent, url, {
      status: 500,
      head: `
        <meta property="og:title" content="Oops" />
        <meta property="og:description" content="Server Error" />
        <link rel="canonical" href="${url}" />
      `,
    });

    await submitURL(page, url);

    expect(
      await queries.findByText(
        /Something wrong with the URL; Please try again later/i
      )
    ).toBeDefined();
    expect(new URL(page.url()).pathname).toBe('/submit');
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
      await queries.findByText(/The submitted resource is now published/i)
    ).toBeDefined();
    expect(new URL(page.url()).pathname).not.toBe('/submit');
  });

  test('redirects user to the resources page if the URL is already submitted', async ({
    page,
    queries,
    baseURL,
  }) => {
    await submitURL(page, `${baseURL}`);
    await page.goto('/submit');
    await submitURL(page, `${baseURL}`);

    expect(
      await queries.findByText(/A resource with the same url is found/i)
    ).toBeDefined();
    expect(new URL(page.url()).pathname).not.toBe('/submit');
  });
});

test.describe.parallel('Scraping', () => {
  test.beforeEach(async ({ page, login }) => {
    await page.goto('/');
    await login('edmundhung');
    await page.goto('/submit');
  });

  test('scrapes the URL for basic details', async ({ page, mf, mockAgent }) => {
    const url = 'http://example.com/remix-guide';
    const title = 'test';
    const description = 'abcd';
    const siteName = 'hijk';

    mockPage(mockAgent, url, {
      status: 200,
      head: `
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${description}" />
        <meta property="og:site_name" content="${siteName}" />
        <link rel="canonical" href="${url}" />
      `,
    });

    await submitURL(page, url);

    const resourceId = getPageResourceId(page);
    const resource = await getResource(mf, resourceId);

    expect(resource).toMatchObject({
      category: 'others',
      title,
      description,
      siteName,
      image: null,
      url,
    });
  });

  test('accepts the url as tutorials only if the term `remix` show up on the title or description of the page', async ({
    page,
    queries,
    mockAgent,
  }) => {
    const url = 'http://example.com/hello-world';

    mockPage(mockAgent, url, {
      status: 200,
    });

    await submitURL(page, url, 'tutorials');

    expect(
      await queries.findByText(
        /The provided data looks invalid; Please make sure a proper category is selected/i
      )
    ).toBeDefined();
    expect(new URL(page.url()).pathname).toBe('/submit');

    const remixRelatedURL = 'http://example.com/remix';

    mockPage(mockAgent, remixRelatedURL, {
      status: 200,
      head: `<title>Remix example</title>`,
    });

    await submitURL(page, remixRelatedURL, 'tutorials');

    expect(
      await queries.findByText(/The submitted resource is now published/i)
    ).toBeDefined();
    expect(new URL(page.url()).pathname).not.toBe('/submit');
  });

  test('accepts the url as packages only if the site name is `npm` and the package name includes `remix`', async ({
    page,
    queries,
    mockAgent,
  }) => {
    const url = 'http://example.com/packages-registry';

    mockPage(mockAgent, url, {
      status: 200,
      head: `
        <title>@random/some-package</title>
        <meta property="og:site_name" content="npm" />
      `,
    });
    mockNpmMetadata(mockAgent, '@random/some-package');

    await submitURL(page, url, 'packages');

    expect(
      await queries.findByText(
        /The provided data looks invalid; Please make sure a proper category is selected/i
      )
    ).toBeDefined();
    expect(new URL(page.url()).pathname).toBe('/submit');

    mockPage(mockAgent, url, {
      status: 200,
      head: `
        <title>@random/remix-package</title>
        <meta property="og:site_name" content="npm" />
      `,
    });
    mockNpmMetadata(mockAgent, '@random/remix-package');

    await submitURL(page, url, 'packages');

    expect(
      await queries.findByText(/The submitted resource is now published/i)
    ).toBeDefined();
    expect(new URL(page.url()).pathname).not.toBe('/submit');
  });

  test('accepts the url as examples only if remix is listed on the dependencies', async ({
    page,
    queries,
    mockAgent,
  }) => {
    const url = 'http://example.com/random-repository';

    mockPage(mockAgent, url, {
      status: 200,
      head: `
        <title>random/repository: Some description here</title>
        <meta property="og:site_name" content="GitHub" />
      `,
    });

    mockGitHubMetadata(mockAgent, 'random/repository', {
      dependencies: {},
      devDependencies: {},
    });

    await submitURL(page, url, 'examples');

    expect(
      await queries.findByText(
        /The provided data looks invalid; Please make sure a proper category is selected/i
      )
    ).toBeDefined();
    expect(new URL(page.url()).pathname).toBe('/submit');

    mockPage(mockAgent, url, {
      status: 200,
      head: `
        <title>random/repository: Some description here</title>
        <meta property="og:site_name" content="GitHub" />
      `,
    });

    mockGitHubMetadata(mockAgent, 'random/repository', {
      dependencies: {
        remix: '1.0.0',
      },
    });

    await submitURL(page, url, 'examples');

    expect(
      await queries.findByText(/The submitted resource is now published/i)
    ).toBeDefined();
    expect(new URL(page.url()).pathname).not.toBe('/submit');
  });

  test('accepts any url as others', async ({ page, queries, mockAgent }) => {
    const url = 'http://example.com/others';

    mockPage(mockAgent, url, {
      status: 200,
    });

    await submitURL(page, url, 'others');

    expect(
      await queries.findByText(/The submitted resource is now published/i)
    ).toBeDefined();
    expect(new URL(page.url()).pathname).not.toBe('/submit');
  });
});
