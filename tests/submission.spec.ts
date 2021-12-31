import { test, expect } from './setup';
import { queries } from '@playwright-testing-library/test';
import { Page } from 'playwright-core';

async function submitURL(page: Page, url: string, category = 'others') {
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
}

test.describe('Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/submit');
  });

  test('shows an error message if user is unauthenticated', async ({
    page,
    baseURL,
    queries,
  }) => {
    await submitURL(page, `${baseURL}`);

    expect(
      await queries.findByText(
        /Please login first before submitting new resources/i
      )
    ).toBeDefined();
  });

  test.describe.parallel('When authenticated', () => {
    test.beforeEach(async ({ page, login }) => {
      await login();
      await page.goto('/submit');
    });

    test('redirects user to the resource page if the submission is success', async ({
      page,
      queries,
      baseURL,
    }) => {
      await submitURL(page, `${baseURL}`);

      expect(
        await queries.findByText(/The submitted resource is now published/i)
      ).toBeDefined();
      expect(new URL(page.url()).pathname).not.toBe('/submit');
    });

    test('redirects user to the resource page even the URL is submitted already', async ({
      page,
      queries,
      baseURL,
    }) => {
      const url = `${baseURL}/submit`;

      await submitURL(page, url, 'others');
      await page.goto('/submit');
      await submitURL(page, url, 'tutorials'); // Category doesn't matter in this case

      expect(
        await queries.findByText(/A resource with the same url is found/i)
      ).toBeDefined();
      expect(new URL(page.url()).pathname).not.toBe('/submit');
    });

    test('shows an error message if the url is unreachable', async ({
      page,
      baseURL,
      queries,
    }) => {
      await submitURL(page, `${baseURL}/url-we-never-use`, 'tutorials');

      expect(
        await queries.findByText(
          /Something wrong with the URL; Please try again later/i
        )
      ).toBeDefined();
      expect(new URL(page.url()).pathname).toBe('/submit');
    });

    test('accepts the url as tutorials only if the term `remix` show up on the title or description of the page', async ({
      page,
      baseURL,
      queries,
    }) => {
      await submitURL(page, 'https://google.com', 'tutorials');

      expect(
        await queries.findByText(
          /The provided data looks invalid; Please make sure a proper category is selected/i
        )
      ).toBeDefined();
      expect(new URL(page.url()).pathname).toBe('/submit');

      await submitURL(page, `${baseURL}/resources`, 'tutorials');

      expect(
        await queries.findByText(/The submitted resource is now published/i)
      ).toBeDefined();
      expect(new URL(page.url()).pathname).not.toBe('/submit');
    });

    test('accepts the url as examples only if remix is listed on the dependencies', async ({
      page,
      queries,
    }) => {
      await submitURL(
        page,
        'https://github.com/remix-run/react-router',
        'examples'
      );

      expect(
        await queries.findByText(
          /The provided data looks invalid; Please make sure a proper category is selected/i
        )
      ).toBeDefined();
      expect(new URL(page.url()).pathname).toBe('/submit');

      await submitURL(
        page,
        'https://github.com/edmundhung/remix-guide',
        'examples'
      );

      expect(
        await queries.findByText(/The submitted resource is now published/i)
      ).toBeDefined();
      expect(new URL(page.url()).pathname).not.toBe('/submit');
    });
  });
});
