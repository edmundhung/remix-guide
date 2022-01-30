import { getSite } from '~/search';
import { Bookmark, SearchOptions } from '~/types';

export function search(
	bookmarks: Bookmark[],
	options: SearchOptions,
): Bookmark[] {
	function match(
		wanted: string[],
		value: string | string[],
		partialMatch = false,
	) {
		if (wanted.length === 0) {
			return true;
		}

		if (partialMatch || Array.isArray(value)) {
			return wanted.every((item) => value.includes(item));
		}

		return wanted.includes(value);
	}

	const entries = bookmarks
		.filter((bookmark) => {
			if (options.includes && !options.includes.includes(bookmark.id)) {
				return false;
			}

			if (options.excludes && options.excludes.includes(bookmark.id)) {
				return false;
			}

			const isMatching =
				match(
					options?.keyword ? options.keyword.toLowerCase().split(' ') : [],
					`${bookmark.title} ${bookmark.description}`.toLowerCase(),
					true,
				) &&
				match(options.author ? [options.author] : [], bookmark.author ?? '') &&
				match(
					options.category ? [options.category] : [],
					bookmark.category ?? '',
				) &&
				match(
					options.site ? [options.site] : [],
					new URL(bookmark.url).hostname,
				) &&
				match(
					([] as string[]).concat(
						options.platform ?? [],
						options.integrations ?? [],
					),
					bookmark.integrations ?? [],
				);

			return isMatching;
		})
		.sort((prev, next) => {
			let keys;

			switch (options.sortBy) {
				case 'hotness':
					keys = ['bookmarkCount', 'viewCount', 'timestamp'];
					break;
				default:
					keys = options.includes ? ['includes'] : ['timestamp'];
					break;
			}

			let diff = 0;

			for (const key of keys) {
				switch (key) {
					case 'timestamp':
						diff =
							new Date(next.timestamp).valueOf() -
							new Date(prev.timestamp).valueOf();
						break;
					case 'bookmarkCount':
						diff = next.bookmarkCount - prev.bookmarkCount;
						break;
					case 'viewCount':
						diff = next.viewCount - prev.viewCount;
						break;
					default:
						diff =
							(options.includes ?? []).indexOf(prev.id) -
							(options.includes ?? '').indexOf(next.id);
				}

				if (diff !== 0) {
					break;
				}
			}

			return diff;
		});

	if (options.limit) {
		return entries.slice(0, options.limit);
	}

	return entries;
}

export function getSuggestions(bookmarks: Bookmark[], bookmark: Bookmark) {
	const suggestions: SearchOptions[] = [];

	if (bookmark.category === 'package' && bookmark.title) {
		suggestions.push({ guide: 'news', integrations: [bookmark.title] });
	}

	if (bookmark.author) {
		suggestions.push({ guide: 'news', author: bookmark.author });
	}

	if (bookmark.category === 'others') {
		suggestions.push({ guide: 'news', site: getSite(bookmark.url) });
	}

	const result = suggestions.map((searchOptions) => ({
		bookmarks: search(bookmarks, {
			...searchOptions,
			sortBy: 'hotness',
			excludes: [bookmark.id],
			limit: 6,
		}),
		searchOptions,
	}));

	return result;
}

// export function patchBookmark(bookmark: Bookmark, user: User): Resource {
// 	const isUserBookmarked = user.bookmarked.includes(bookmark.id) ?? false;
// 	const isResourceBookmarked = bookmark.bookmarked.includes(user.profile.id);

// 	if (isUserBookmarked === isResourceBookmarked) {
// 		return bookmark;
// 	}

// 	return {
// 		...bookmark,
// 		bookmarked: isUserBookmarked
// 			? bookmark.bookmarked.concat(user.profile.id)
// 			: bookmark.bookmarked.filter((id) => id !== user.profile.id),
// 	};
// }
