import { SearchOptions } from '~/types';
import { platforms } from '~/config';
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
	const [, guide, list] =
		pathname.match(/^\/([a-z-0-9]+)(?:\/([a-z-0-9]+))*$/i) ?? [];
	const options: SearchOptions = {
		keyword: searchParams.get('q'),
		author: searchParams.get('author'),
		guide: guide ?? null,
		list: list ?? null,
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

export function createIntegrationSearch(value: string): string {
	const searchParams = new URLSearchParams({ sort: 'top' });

	if (platforms.includes(value)) {
		searchParams.set('platform', value);
	} else {
		searchParams.set('integration', value);
	}

	return searchParams.toString();
}

export function getResourcePathname(options: SearchOptions): string {
	let base = `/${options.guide ?? ''}`;

	if (options.list) {
		base += `/${options.list}`;
	}

	return base;
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
	const pathname = getResourcePathname(options);

	if (resourceId) {
		searchParams.set('resourceId', resourceId);
	}

	const search = searchParams.toString();

	return search ? `${pathname}?${search}` : pathname;
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

	return options[0] ?? 'News';
}
