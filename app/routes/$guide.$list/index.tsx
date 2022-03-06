import type {
	LoaderFunction,
	ActionFunction,
	ShouldReloadFunction,
	MetaFunction,
} from 'remix';
import { useLoaderData, json } from 'remix';
import About from '~/components/About';
import ResourcesDetails from '~/components/ResourcesDetails';
import SuggestedResources from '~/components/SuggestedResources';
import { formatMeta, notFound } from '~/helpers';
import { getSuggestions, patchResource } from '~/resources';
import { getSearchOptions, getTitleBySearchOptions } from '~/search';
import type { Context, Resource, SearchOptions, User } from '~/types';

interface LoaderData {
	resource: Resource;
	message: string | null;
	user: User | null;
	suggestions: Array<{
		entries: Resource[];
		searchOptions: SearchOptions;
	}>;
}

export let meta: MetaFunction = ({ params, location }) => {
	const { guide, list } = params;

	if (!guide || !list) {
		return {};
	}

	const searchOptions = getSearchOptions(
		`${location.pathname}${location.search}`,
	);
	const title = getTitleBySearchOptions(searchOptions);

	return formatMeta({
		title,
		'og:url': `https://remix.guide/${guide}/${list}`,
	});
};

export let action: ActionFunction = async ({ context, request }) => {
	const { session, userStore } = context as Context;
	const [profile, formData] = await Promise.all([
		session.isAuthenticated(),
		request.formData(),
	]);
	const type = formData.get('type');
	const url = formData.get('url')?.toString();
	const resourceId = formData.get('resourceId')?.toString();

	if (!type || !url || !resourceId) {
		return new Response('Bad Request', { status: 400 });
	}

	if (type === 'view') {
		await userStore.view(profile?.id ?? null, resourceId, url);
	} else {
		if (!profile) {
			return new Response('Unauthorized', { status: 401 });
		}

		switch (type) {
			case 'bookmark':
				await userStore.bookmark(profile.id, resourceId, url);
				break;
			case 'unbookmark':
				await userStore.unbookmark(profile.id, resourceId, url);
				break;
			default:
				return new Response('Bad Request', { status: 400 });
		}
	}

	return null;
};

export let loader: LoaderFunction = async ({ context, params, request }) => {
	if (params.list !== 'history' && params.list !== 'bookmarks') {
		throw notFound();
	}

	const url = new URL(request.url);
	const resourceId = url.searchParams.get('resourceId');

	if (!resourceId) {
		return json({});
	}

	const { session, resourceStore, userStore } = context as Context;
	const [list, profile] = await Promise.all([
		resourceStore.list(),
		session.isAuthenticated(),
	]);
	const resource = list[resourceId];

	if (!resource) {
		throw notFound();
	}

	const [user, [message, setCookieHeader]] = await Promise.all([
		profile?.id ? userStore.getUser(profile.id) : null,
		session.getFlashMessage(),
	]);

	return json(
		{
			user,
			message,
			resource: user ? patchResource(resource, user) : resource,
			suggestions: getSuggestions(list, resource),
		},
		{
			headers: setCookieHeader,
		},
	);
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
	const { resource, message, user, suggestions } = useLoaderData<LoaderData>();

	if (!resource) {
		return <About />;
	}

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
