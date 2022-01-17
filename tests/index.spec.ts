import { test, expect } from './setup';
import {
	getPageURL,
	listResourcesMetadata,
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

	test('shows all resources submitted', async ({ page, mf, queries }) => {
		const resources = await listResourcesMetadata(mf);
		const links = await Promise.all(
			resources.map((resource) =>
				resource.title ? queries.queryByTitle(resource.title) : null,
			),
		);

		expect(links).toHaveLength(3);
		expect(links).not.toContain(null);

		for (let i = 0; i < links.length; i++) {
			await links[i]?.click();

			expect(getPageURL(page).pathname).toBe(`/resources/${resources[i].id}`);
		}
	});
});
