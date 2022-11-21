import { test, expect } from './setup';
import {
	getPageResourceId,
	listResources,
	mockPage,
	submitURL,
	login,
} from './utils';

test.describe('Index', () => {
	test.beforeEach(async ({ page, mockAgent }) => {
		await page.goto('/');
		await login(page, mockAgent);

		for (let i = 1; i <= 3; i++) {
			await page.goto('/submit');

			const url = `http://example.com/test-resources-${i}`;

			mockPage(mockAgent, url, {
				head: `<title>Test ${i}</title>`,
			});

			await submitURL(page, url);
		}

		await page.goto('/');
	});

	test('shows all URLs submitted', async ({ page, mf }) => {
		const list = await listResources(mf);
		const feed = page.locator('section', { hasText: 'Discover' });
		const resources = Object.values(list ?? {});

		for (const resource of resources) {
			if (!resource.title) {
				throw new Error('resource title is undefined');
			}

			await feed.getByTitle(resource.title).click();

			expect(getPageResourceId(page)).toBe(resource.id);
		}
	});
});
