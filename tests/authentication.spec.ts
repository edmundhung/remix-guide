import { test, expect } from './setup';
import { login } from './utils';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows a Logout button after login', async ({
    page,
    mockAgent,
    queries,
  }) => {
    await login(page, mockAgent);

    expect(await queries.queryByText(/Logout/i)).toBeDefined();
  });

  test('allows user to logout', async ({ page, mockAgent, queries }) => {
    await login(page, mockAgent);

    const logoutButton = await queries.findByText(/Logout/i);

    await logoutButton.click();

    expect(await queries.queryByText(/Login with GitHub/i)).toBeDefined();
  });
});
