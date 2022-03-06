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

	test('shows all URLs submitted', async ({ page, mf, queries }) => {
		const list = await listResources(mf);
		const resources = Object.values(list ?? {});
		const links = await Promise.all(
			resources.map((resource) =>
				resource.title ? queries.queryByTitle(resource.title) : null,
			),
		);

		expect(links).toHaveLength(3);
		expect(links).not.toContain(null);

		for (let i = 0; i < links.length; i++) {
			await links[i]?.click();

			expect(getPageResourceId(page)).toBe(resources[i].id);
		}
	});
});
