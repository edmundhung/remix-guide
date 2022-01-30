import { test, expect } from './setup';
import {
	listBookmarks,
	mockPage,
	submitURL,
	login,
	getPageBookmarkId,
	getPageGuide,
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

	test('shows all pages submitted', async ({ page, mf, queries }) => {
		const guide = getPageGuide(page);
		const bookmarks = await listBookmarks(mf, guide);
		const links = await Promise.all(
			bookmarks.map((bookmark) =>
				bookmark.title ? queries.queryByTitle(bookmark.title) : null,
			),
		);

		expect(links).toHaveLength(3);
		expect(links).not.toContain(null);

		for (let i = 0; i < links.length; i++) {
			await links[i]?.click();

			expect(getPageBookmarkId(page)).toBe(bookmarks[i].id);
		}
	});
});
