import { test, expect } from './setup';

test.describe('Index', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show the name of the platform', async ({ queries }) => {
    const result = await queries.findAllByText('Remix Guide', {
      exact: false,
    });

    expect(result).not.toHaveLength(0);
  });
});
