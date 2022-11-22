import type { SearchOptions } from '~/types';
import { capitalize } from '~/helpers';

/**
 * Number of entries to be shown by default
 */
const defaultLimit = 25;

export function getRelatedSearchParams(search: string): URLSearchParams {
	const searchParams = new URLSearchParams(search);
	const supported = [
		'list',
		'q',
		'category',
		'platform',
		'integration',
		'author',
		'site',
		'sort',
		'limit',
	];

	for (const [key, value] of Array.from(searchParams.entries())) {
		if (!supported.includes(key) || value === '') {
			searchParams.delete(key);
		}
	}

	return searchParams;
}

export function getSearchOptions(url: string): SearchOptions {
	function parseNumber(text: string | null, defaultNumber: number): number {
		if (!text) {
			return defaultNumber;
		}

		const number = Number(text);

		return !isNaN(number) ? number : defaultNumber;
	}

	const { pathname, searchParams } = new URL(url, 'https://remix.guide');
	const options: SearchOptions = {
		keyword: searchParams.get('q'),
		author: searchParams.get('author'),
		list:
			pathname.startsWith('/resources') || pathname === '/rss.xml'
				? searchParams.get('list')
				: pathname.slice(1).split('/').shift(),
		site: searchParams.get('site'),
		category: searchParams.get('category'),
		platform: searchParams.get('platform'),
		integrations: searchParams.getAll('integration'),
		limit: parseNumber(searchParams.get('limit'), defaultLimit),
		sort: searchParams.get('sort') ?? 'new',
	};

	return Object.fromEntries(
		Object.entries(options).map(([key, value]) => [key, value ? value : null]),
	);
}

export function excludeParams(
	key: string,
	searchParams: URLSearchParams,
): string {
	const search = new URLSearchParams(searchParams);

	if (search.has(key)) {
		search.delete(key);
	}

	return search.toString();
}

export function getSite(url: string): string {
	return new URL(url).hostname;
}

export function getResourceSearchParams(
	options: SearchOptions,
): URLSearchParams {
	return new URLSearchParams(
		Object.entries(options).flatMap(([key, value]) => {
			switch (key as keyof SearchOptions) {
				case 'author':
				case 'category':
				case 'platform':
				case 'site':
				case 'keyword':
				case 'limit':
				case 'list':
				case 'sort': {
					let k = key;
					let v = value;

					if (k === 'keyword') {
						k = 'q';
					} else if (
						(k === 'sort' && v === 'new') ||
						(k === 'limit' && v === defaultLimit)
					) {
						v = '';
					}

					if (v) {
						return [[k, v]];
					}

					break;
				}
				case 'integrations':
					if (Array.isArray(value)) {
						return value.map((v) => ['integration', v]);
					}

					break;
			}

			return [];
		}),
	);
}

export function getResourceURL(
	options: SearchOptions,
	resourceId?: string | null,
): string {
	const searchParams = getResourceSearchParams(options);

	if (
		!resourceId &&
		searchParams.has('list') &&
		Array.from(searchParams.keys()).length === 1
	) {
		return `/${options.list}`;
	}

	return resourceId
		? `/resources/${resourceId}?${searchParams}`
		: `/resources?${searchParams}`;
}

export function toggleSearchParams(search: string, key: string): string {
	const searchParams = new URLSearchParams(search);

	if (searchParams.get('open') === key) {
		searchParams.delete('open');
	} else {
		searchParams.set('open', key);
	}

	return searchParams.toString();
}

export function getTitleBySearchOptions(searchOptions: SearchOptions): string {
	const options = Object.keys(searchOptions).reduce((result, key) => {
		switch (key as keyof SearchOptions) {
			case 'author':
				if (searchOptions.author) {
					result.push(`Made by ${searchOptions.author}`);
				}
				break;
			case 'category':
				if (searchOptions.category) {
					result.push(`Categorised as ${searchOptions.category}`);
				}
				break;
			case 'keyword':
				if (searchOptions.keyword?.trim()) {
					result.push(`Mentioned ${searchOptions.keyword}`);
				}
				break;
			case 'platform':
				if (searchOptions.platform) {
					result.push(`Hosted on ${searchOptions.platform}`);
				}
				break;
			case 'list':
				if (searchOptions.list) {
					result.push(capitalize(searchOptions.list));
				}
				break;
			case 'integrations':
				if ((searchOptions.integrations ?? []).length > 0) {
					result.push(`Built with ${searchOptions.integrations?.join(', ')}`);
				}
				break;
			case 'site':
				if (searchOptions.site) {
					result.push(`Published on ${searchOptions.site}`);
				}
				break;
		}

		return result;
	}, [] as string[]);

	if (options.length > 1) {
		return 'Search Result';
	}

	return options[0] ?? 'Discover';
}
