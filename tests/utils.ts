import type { Miniflare } from 'miniflare';
import type { Page } from 'playwright-core';
import type { MockAgent } from 'undici';
import { queries } from '@playwright-testing-library/test';
import type { Resource } from '../worker/types';

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
  options: { status?: number; head?: string; body?: string }
) {
  const url = new URL(urlText);
  const client = mockAgent.get(url.origin);
  const html = `
        <html>
            <head>${options.head}</head>
            <body>${options.body}</body>
        </html>
    `;

  client
    .intercept({
      path: urlText.replace(url.origin, ''),
      method: 'GET',
    })
    .reply(options.status ?? 200, html);
}

export async function getResource(mf: Miniflare, resourceId: string) {
  const content = await mf.getKVNamespace('CONTENT');
  const resource = await content.get<Resource>(
    `resources/${resourceId}`,
    'json'
  );

  return resource;
}

export function getPageResourceId(page: Page): string {
  return new URL(page.url()).pathname.replace('/resources/', '');
}
