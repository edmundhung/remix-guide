import { getSite } from '~/search';
import { ResourceMetadata, SearchOptions, Resource, User } from '~/types';

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
							new Date(next.createdAt).valueOf() -
							new Date(prev.createdAt).valueOf();
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
							(options.includes ?? []).indexOf(next.id);
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

export function getSuggestions(
	resources: ResourceMetadata[],
	resource: Resource,
) {
	const suggestions: SearchOptions[] = [];

	if (resource.category === 'package' && resource.title) {
		suggestions.push({ integrations: [resource.title] });
	}

	if (resource.author) {
		suggestions.push({ author: resource.author });
	}

	if (resource.category === 'others') {
		suggestions.push({ site: getSite(resource.url) });
	}

	const result = suggestions.map((searchOptions) => ({
		entries: search(resources, {
			...searchOptions,
			sortBy: 'hotness',
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
