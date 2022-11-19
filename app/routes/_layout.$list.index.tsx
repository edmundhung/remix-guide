import type {
	LoaderFunction,
	ActionFunction,
	MetaFunction,
} from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import type { ShouldReloadFunction } from '@remix-run/react';
import { Form, useLocation, useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';
import clsx from 'clsx';
import About from '~/components/About';
import ResourcesDetails from '~/components/ResourcesDetails';
import SuggestedResources from '~/components/SuggestedResources';
import { formatMeta, notFound } from '~/helpers';
import { getSuggestions, patchResource } from '~/resources';
import { getSearchOptions, getTitleBySearchOptions } from '~/search';
import type { Context, Resource, SearchOptions, User } from '~/types';
import BookmarkDetails from '~/components/BookmarkDetails';
import { useSessionData } from '~/hooks';

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
		description: 'A platform for sharing everything about Remix',
		'og:url': `https://remix.guide/${guide}/${list}`,
	});
};

export let action: ActionFunction = async ({ params, context, request }) => {
	const { session, userStore, resourceStore } = context as Context;
	const [profile, formData] = await Promise.all([
		session.getUserProfile(),
		request.formData(),
	]);
	const type = formData.get('type');
	const resourceId = formData.get('resourceId')?.toString();

	if (!type || !resourceId) {
		return new Response('Bad Request', { status: 400 });
	}

	if (type === 'view') {
		const url = formData.get('url')?.toString();

		if (!url) {
			return new Response('Bad Request', { status: 400 });
		}

		await userStore.view(profile?.id ?? null, resourceId, url);
	} else {
		if (!profile) {
			return new Response('Unauthorized', { status: 401 });
		}

		switch (type) {
			case 'bookmark': {
				const url = formData.get('url')?.toString();

				if (!url) {
					return new Response('Bad Request', { status: 400 });
				}

				await userStore.bookmark(profile.id, resourceId, url);
				break;
			}
			case 'unbookmark': {
				const url = formData.get('url')?.toString();

				if (!url) {
					return new Response('Bad Request', { status: 400 });
				}

				await userStore.unbookmark(profile.id, resourceId, url);
				break;
			}
			case 'update': {
				const description = formData.get('description')?.toString() ?? null;
				const lists = formData.getAll('lists').map((value) => value.toString());

				await resourceStore.updateBookmark(resourceId, description, lists);

				return redirect(request.url, {
					headers: {
						'Set-Cookie': await session.flash(
							'The bookmark is updated successfully',
							'success',
						),
					},
				});
			}
			case 'delete': {
				await resourceStore.deleteBookmark(resourceId);

				return redirect(`/${params.guide}`, {
					headers: {
						'Set-Cookie': await session.flash(
							'The bookmark is deleted successfully',
							'success',
						),
					},
				});
			}
			default:
				return new Response('Bad Request', { status: 400 });
		}
	}

	return null;
};

export let loader: LoaderFunction = async ({ context, request }) => {
	const url = new URL(request.url);
	const resourceId = url.searchParams.get('resourceId');

	if (!resourceId) {
		return json({});
	}

	const { session, resourceStore, userStore } = context as Context;
	const [list, profile] = await Promise.all([
		resourceStore.list(),
		session.getUserProfile(),
	]);
	const resource = list[resourceId];

	if (!resource) {
		throw notFound();
	}

	const user = profile?.id ? await userStore.getUser(profile.id) : null;

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

	return ['bookmark', 'unbookmark', 'update', 'delete'].includes(
		submission?.formData.get('type')?.toString() ?? '',
	);
};

export default function ListDetails() {
	const { resource, user, suggestions } = useLoaderData<LoaderData>();
	const { message } = useSessionData();
	const location = useLocation();
	const [showBookmark, action] = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const showBookmark = searchParams.get('open') === 'bookmark';

		searchParams.delete('open');

		return [showBookmark, `?${searchParams.toString()}&index`];
	}, [location.search]);

	if (!resource) {
		return <About />;
	}

	return (
		<div className="flex flex-row">
			<div className={clsx('flex-1', { 'hidden lg:block': showBookmark })}>
				<ResourcesDetails resource={resource} user={user} message={message}>
					{suggestions.map(({ entries, searchOptions }) => (
						<SuggestedResources
							key={JSON.stringify(searchOptions)}
							entries={entries}
							searchOptions={searchOptions}
						/>
					))}
				</ResourcesDetails>
			</div>
			{showBookmark ? (
				<Form
					className="w-full lg:w-80 3xl:w-96 lg:border-l"
					method="post"
					action={action}
				>
					<BookmarkDetails resource={resource} />
				</Form>
			) : null}
		</div>
	);
}
