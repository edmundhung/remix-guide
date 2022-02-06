import type { LoaderFunction, ShouldReloadFunction, MetaFunction } from 'remix';
import { useLoaderData, json } from 'remix';
import About from '~/components/About';
import ResourcesDetails from '~/components/ResourcesDetails';
import SuggestedResources from '~/components/SuggestedResources';
import { formatMeta, notFound } from '~/helpers';
import { getSuggestions, patchResource } from '~/resources';
import { getSearchOptions, getTitleBySearchOptions } from '~/search';
import type {
	Context,
	Resource,
	ResourceMetadata,
	SearchOptions,
	User,
} from '~/types';

interface LoaderData {
	resource: Resource;
	user: User | null;
	suggestions: Array<{
		entries: ResourceMetadata[];
		searchOptions: SearchOptions;
	}>;
}

export let meta: MetaFunction = ({ params, location }) => {
	const { guide } = params;

	if (!guide) {
		return {};
	}

	const searchOptions = getSearchOptions(
		`${location.pathname}${location.search}`,
	);
	const title = getTitleBySearchOptions(searchOptions);

	return formatMeta({
		title,
		'og:url': `https://remix.guide/${guide}`,
	});
};

export let loader: LoaderFunction = async ({ context, request }) => {
	const url = new URL(request.url);
	const resourceId = url.searchParams.get('resourceId');

	if (!resourceId) {
		return json({});
	}

	const { session, resourceStore, userStore } = context as Context;
	const [resource, profile] = await Promise.all([
		resourceStore.query(resourceId),
		session.isAuthenticated(),
	]);

	if (!resource) {
		throw notFound();
	}

	const [list, user] = await Promise.all([
		resourceStore.listResources(),
		profile?.id ? userStore.getUser(profile.id) : null,
	]);

	return json({
		user,
		resource: user ? patchResource(resource, user) : resource,
		suggestions: getSuggestions(list, resource),
	});
};

export const unstable_shouldReload: ShouldReloadFunction = ({
	prevUrl,
	url,
	submission,
}) => {
	if (
		prevUrl.searchParams.get('resourceId') !==
		url.searchParams.get('resourceId')
	) {
		return true;
	}

	return ['bookmark', 'unbookmark'].includes(
		submission?.formData.get('type')?.toString() ?? '',
	);
};

export default function UserProfile() {
	const { resource, user, suggestions } = useLoaderData<LoaderData>();

	if (!resource) {
		return <About />;
	}

	return (
		<ResourcesDetails resource={resource} user={user}>
			{suggestions.map(({ entries, searchOptions }) => (
				<SuggestedResources
					key={JSON.stringify(searchOptions)}
					entries={entries}
					searchOptions={searchOptions}
				/>
			))}
		</ResourcesDetails>
	);
}
