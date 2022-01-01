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
