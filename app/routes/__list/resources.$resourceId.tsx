import type {
	LoaderFunction,
	ActionFunction,
	ShouldReloadFunction,
	MetaFunction,
} from 'remix';
import { json, redirect, useLoaderData } from 'remix';
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

export let action: ActionFunction = async ({ context, params, request }) => {
	const { session, store } = context as Context;
	const profile = await session.isAuthenticated();
	const formData = await request.formData();
	const type = formData.get('type');

	if (type === 'view') {
		await store.view(profile?.id ?? null, params.resourceId ?? '');
		return new Response('OK', { status: 200 });
	}

	if (!profile) {
		return new Response('Unauthorized', { status: 401 });
	}

	switch (type) {
		case 'bookmark':
			await store.bookmark(profile.id, params.resourceId ?? '');
			break;
		case 'unbookmark':
			await store.unbookmark(profile.id, params.resourceId ?? '');
			break;
		default:
			return new Response('Bad Request', { status: 400 });
	}

	return redirect(
		formData.get('referer')?.toString() ??
			request.headers.get('referer') ??
			request.url,
	);
};

export let loader: LoaderFunction = async ({ context, params }) => {
	const { session, store } = context as Context;
	const [resource, profile] = await Promise.all([
		store.query(params.resourceId ?? ''),
		session.isAuthenticated(),
	]);

	if (!resource) {
		throw notFound();
	}

	const [[message, setCookieHeader], user, suggestions] = await Promise.all([
		session.getFlashMessage(),
		profile?.id ? store.getUser(profile.id) : null,
		getSuggestions(store, resource, profile?.id ?? null),
	]);

	return json(
		{
			user,
			resource: user ? patchResource(resource, user) : resource,
			message,
			suggestions,
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
