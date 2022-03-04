import { getSite } from '~/search';
import { ResourceMetadata, SearchOptions, Resource, User } from '~/types';

function calculateScore(resource: ResourceMetadata): number {
	const timeScore =
		(new Date(resource.createdAt).valueOf() -
			new Date('2021-12-24T00:00:00.000Z').valueOf()) /
		1000 /
		3600 /
		24;
	const bookmarkScore =
		resource.bookmarkCount > 0 ? Math.log10(resource.bookmarkCount) + 1 : 0;
	const viewScore = Math.log10(resource.viewCount);

	return 1 * timeScore + 10 * bookmarkScore + 1.5 * viewScore;
}

function compareResources(
	key: string,
	prev: ResourceMetadata,
	next: ResourceMetadata,
): number {
	let diff = 0;

	switch (key) {
		case 'timestamp':
			diff =
				new Date(next.createdAt).valueOf() - new Date(prev.createdAt).valueOf();
			break;
		case 'bookmarkCount':
			diff = next.bookmarkCount - prev.bookmarkCount;
			break;
		case 'viewCount':
			diff = next.viewCount - prev.viewCount;
			break;
	}

	return diff;
}

export function search(
	resources: ResourceMetadata[],
	options: SearchOptions,
): ResourceMetadata[] {
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

	const entries = resources
		.filter((resource) => {
			if (options.includes && !options.includes.includes(resource.id)) {
				return false;
			}

			if (options.excludes && options.excludes.includes(resource.id)) {
				return false;
			}

			const isMatching =
				match(
					options?.keyword ? options.keyword.toLowerCase().split(' ') : [],
					`${resource.title} ${resource.description}`.toLowerCase(),
					true,
				) &&
				match(options.author ? [options.author] : [], resource.author ?? '') &&
				match(
					options.category ? [options.category] : [],
					resource.category ?? '',
				) &&
				match(
					options.site ? [options.site] : [],
					new URL(resource.url).hostname,
				) &&
				match(
					([] as string[]).concat(
						options.platform ?? [],
						options.integrations ?? [],
					),
					resource.integrations ?? [],
				);

			return isMatching;
		})
		.sort((prev, next) => {
			let diff = 0;

			switch (options.sort) {
				case 'top':
					for (const key of ['bookmarkCount', 'viewCount', 'timestamp']) {
						diff = compareResources(key, prev, next);

						if (diff !== 0) {
							break;
						}
					}
					break;
				case 'hot':
					diff = calculateScore(next) - calculateScore(prev);
					break;
				case 'new':
				default:
					diff = options.includes
						? options.includes.indexOf(prev.id) -
						  options.includes.indexOf(next.id)
						: compareResources('timestamp', prev, next);
					break;
			}

			return diff;
		});

	if (options.limit) {
		return entries.slice(0, options.limit);
	}

	return entries;
}

export function getSuggestions(
	resources: ResourceMetadata[],
	resource: Resource,
) {
	const suggestions: SearchOptions[] = [];

	if (resource.category === 'package' && resource.title) {
		suggestions.push({
			guide: 'news',
			integrations: [resource.title],
			sort: 'top',
		});
	}

	if (resource.author) {
		suggestions.push({ guide: 'news', author: resource.author, sort: 'top' });
	}

	if (resource.category === 'others') {
		suggestions.push({
			guide: 'news',
			site: getSite(resource.url),
			sort: 'top',
		});
	}

	const result = suggestions.map((searchOptions) => ({
		entries: search(resources, {
			...searchOptions,
			excludes: [resource.id],
			limit: 6,
		}),
		searchOptions,
	}));

	return result;
}

export function patchResource(resource: Resource, user: User): Resource {
	const isUserBookmarked = user.bookmarked.includes(resource.id) ?? false;
	const isResourceBookmarked =
		resource.bookmarkUsers?.includes(user.profile.id) ?? false;

	if (isUserBookmarked === isResourceBookmarked) {
		return resource;
	}

	return {
		...resource,
		bookmarkUsers: isUserBookmarked
			? [...(resource.bookmarkUsers ?? []), user.profile.id]
			: resource.bookmarkUsers?.filter((id) => id !== user.profile.id),
	};
}
