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
        /Please login first before submitting new resources/i
      )
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
        /This feature is not enabled on your account yet/i
      )
    ).toBeDefined();
  });

  test('success as an admin', async ({ page, queries, mockAgent }) => {
    const url = 'http://example.com/admin';

    await login(page, mockAgent, 'edmundhung');
    await page.goto('/submit');

    mockPage(mockAgent, url);

    await submitURL(page, url);

    expect(
      await queries.findByText(/The submitted resource is now published/i)
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
        /Something wrong with the URL; Please try again later/i
      )
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
        /Something wrong with the URL; Please try again later/i
      )
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
      await queries.findByText(/The submitted resource is now published/i)
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
      await queries.findByText(/A resource with the same url is found/i)
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
    expect(getPageURL(page).pathname).toBe('/submit');

    mockPage(mockAgent, url, {
      status: 200,
      head: `<title>Remix example</title>`,
    });

    await submitURL(page, url, 'tutorials');

    expect(
      await queries.findByText(/The submitted resource is now published/i)
    ).toBeDefined();
    expect(getPageURL(page).pathname).not.toBe('/submit');
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
    expect(getPageURL(page).pathname).toBe('/submit');

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
    expect(getPageURL(page).pathname).not.toBe('/submit');
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
    expect(getPageURL(page).pathname).toBe('/submit');

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
    expect(getPageURL(page).pathname).not.toBe('/submit');
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
    expect(getPageURL(page).pathname).not.toBe('/submit');
  });
});
