import { getSite } from '~/search';
import {
	Context,
	ResourceMetadata,
	SearchOptions,
	Resource,
	User,
} from '~/types';

export async function getSuggestions(
	store: Context['store'],
	resource: ResourceMetadata,
	userId: string | null,
) {
	const suggestions: SearchOptions[] = [];

	if (resource.category === 'package') {
		suggestions.push({ integrations: [resource.title] });
	}

	if (typeof resource.author !== 'undefined' && resource.author !== null) {
		suggestions.push({ author: resource.author });
	}

	if (resource.category === 'others') {
		suggestions.push({ site: getSite(resource.url) });
	}

	const result = await Promise.all(
		suggestions.map(async (searchOptions) => {
			const entries = await store.search(userId, {
				...searchOptions,
				sortBy: 'hotness',
				excludes: [resource.id],
				limit: 6,
			});

			return {
				entries,
				searchOptions,
			};
		}),
	);

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
