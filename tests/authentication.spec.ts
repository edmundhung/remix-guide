import { test, expect } from './setup';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows a Logout button after login', async ({ login, queries }) => {
    await login();

    expect(await queries.queryByText(/Logout/i)).toBeDefined();
  });

  test('allows user to logout', async ({ login, queries }) => {
    await login();

    const logoutButton = await queries.findByText(/Logout/i);

    await logoutButton.click();

    expect(await queries.queryByText(/Login with GitHub/i)).toBeDefined();
  });
});
