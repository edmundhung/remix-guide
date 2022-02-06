import type { LoaderFunction, ShouldReloadFunction, MetaFunction } from 'remix';
import { json, useLoaderData } from 'remix';
import { capitalize, formatMeta, notFound } from '~/helpers';
import type {
	Context,
	Resource,
	ResourceMetadata,
	SearchOptions,
	User,
} from '~/types';
import SuggestedResources from '~/components/SuggestedResources';
import ResourcesDetails from '~/components/ResourcesDetails';
import { getSuggestions, patchResource } from '~/resources';

interface LoaderData {
	resource: Resource;
	user: User | null;
	message: string | null;
	suggestions: Array<{
		entries: ResourceMetadata[];
		searchOptions: SearchOptions;
	}>;
}

export let meta: MetaFunction = ({ data }: { data?: LoaderData }) => {
	return formatMeta({
		title: `${capitalize(data?.resource.category)} - ${
			data?.resource.title ?? data?.resource.url
		}`,
		description: data?.resource.description ?? '',
		'og:url': `https://remix.guide/resources/${data?.resource.id}`,
	});
};

export let loader: LoaderFunction = async ({ context, params }) => {
	const { session, resourceStore, userStore } = context as Context;
	const [resource, profile] = await Promise.all([
		resourceStore.query(params.resourceId ?? ''),
		session.isAuthenticated(),
	]);

	if (!resource) {
		throw notFound();
	}

	const [list, [message, setCookieHeader], user] = await Promise.all([
		resourceStore.listResources(),
		session.getFlashMessage(),
		profile?.id ? userStore.getUser(profile.id) : null,
	]);

	return json(
		{
			user,
			resource: user ? patchResource(resource, user) : resource,
			message,
			suggestions: getSuggestions(list, resource),
		},
		{
			headers: setCookieHeader,
		},
	);
};

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
	return ['bookmark', 'unbookmark'].includes(
		submission?.formData.get('type')?.toString() ?? '',
	);
};

export default function Details() {
	const { resource, user, message, suggestions } = useLoaderData<LoaderData>();
	return (
		<ResourcesDetails resource={resource} user={user} message={message}>
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
