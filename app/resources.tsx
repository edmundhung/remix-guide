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

	if (resource.category === 'packages') {
		suggestions.push({ integrations: [resource.title] });
	}

	if (typeof resource.author !== 'undefined' && resource.author !== null) {
		suggestions.push({ author: resource.author });
	}

	if (['concepts', 'tutorials', 'others'].includes(resource.category ?? '')) {
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
	const isResourceBookmarked = resource.bookmarked.includes(user.profile.id);

	if (isUserBookmarked === isResourceBookmarked) {
		return resource;
	}

	return {
		...resource,
		bookmarked: isUserBookmarked
			? resource.bookmarked.concat(user.profile.id)
			: resource.bookmarked.filter((id) => id !== user.profile.id),
	};
}
