import type { Miniflare } from 'miniflare';
import type { Page } from 'playwright-core';
import type { MockAgent } from 'undici';
import { queries, getDocument } from '@playwright-testing-library/test';
import type { Resource, ResourceMetadata } from '../worker/types';

export async function login(
  page: Page,
  mockAgent: MockAgent,
  name = 'edmundhung'
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
      }).toString()
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

  await page.route('/login', async (route, request) => {
    // It seems like there is no way to intercept request in the middle of the redirect
    // Due to limitation of the devtool protocol
    // We expect the browser is already redirected to github login page after the request
    const response = await page.request.fetch(request);
    const responseURL = new URL(response.url());
    const returnTo = responseURL.searchParams.get('return_to');

    // We need the `return_to` search params to find out all information we need
    if (!returnTo) {
      await route.abort();
      return;
    }

    const url = new URL(decodeURIComponent(returnTo), responseURL.origin);

    route.fulfill({
      status: 302,
      headers: {
        Location: `${url.searchParams.get(
          'redirect_uri'
        )}?code=remix-guide&state=${url.searchParams.get('state')}`,
      },
    });
  });

  await loginButton.click();
}

export async function submitURL(page: Page, url: string, category = 'others') {
  const $form = await page.$('form[action="/submit"]');

  if (!$form) {
    throw new Error('Fail to locate the submission form');
  }

  const option = await queries.findByText($form, category, { exact: false });

  await option.click();

  const input = await queries.findByLabelText(
    $form,
    /Then, paste the URL here/i
  );

  await input.fill(url);

  const submitButton = await queries.findByRole($form, 'button', {
    name: /Submit/i,
  });

  await submitButton.click();

  await page.waitForNavigation({ waitUntil: 'networkidle' });
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
  options: Partial<MockGitHubOptions>
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
      options?.files?.map((name) => ({ name })) ?? [{ name: 'package.json' }]
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
  options?: Partial<MockNpmOptions>
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
  apiKey: string
) {
  const youtubeAPI = mockAgent.get('https://youtube.googleapis.com');

  youtubeAPI
    .intercept({
      path: `/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`,
      method: 'GET',
    })
    .reply(200, {});
}

export function mockPage(
  mockAgent: MockAgent,
  urlText: string,
  options?: { status?: number; head?: string; body?: string }
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
      path: urlText.replace(url.origin, ''),
      method: 'GET',
    })
    .reply(options?.status ?? 200, html);
}

export async function getResource(mf: Miniflare, resourceId: string) {
  const content = await mf.getKVNamespace('CONTENT');
  const resource = await content.get<Resource>(
    `resources/${resourceId}`,
    'json'
  );

  return resource;
}

export async function listResourcesMetadata(mf: Miniflare) {
  const content = await mf.getKVNamespace('CONTENT');
  const resources = await content.list<ResourceMetadata>({
    prefix: 'resources/',
  });

  return resources.keys.flatMap((key) => key.metadata ?? []);
}

export function getPageResourceId(page: Page): string {
  return new URL(page.url()).pathname.replace('/resources/', '');
}

export function getPageURL(page: Page): URL {
  return new URL(page.url());
}
