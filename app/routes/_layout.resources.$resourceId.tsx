import type {
	LoaderArgs,
	ActionArgs,
	MetaFunction,
} from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import type { ShouldReloadFunction } from '@remix-run/react';
import { Form, useLocation, useLoaderData } from '@remix-run/react';
import { useMemo } from 'react';
import clsx from 'clsx';
import ResourcesDetails from '~/components/ResourcesDetails';
import SuggestedResources from '~/components/SuggestedResources';
import { formatMeta, notFound } from '~/helpers';
import { getSuggestions, patchResource } from '~/resources';
import BookmarkDetails from '~/components/BookmarkDetails';
import { useSessionData } from '~/hooks';

export async function action({ params, context, request }: ActionArgs) {
	const { session, userStore, resourceStore } = context;
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

				return redirect('/', {
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
}

export async function loader({ context, params }: LoaderArgs) {
	const { session, resourceStore, userStore } = context;
	const [list, profile] = await Promise.all([
		resourceStore.list(),
		session.getUserProfile(),
	]);
	const resource = params.resourceId ? list[params.resourceId] : null;

	if (!resource) {
		throw notFound();
	}

	const user = profile?.id ? await userStore.getUser(profile.id) : null;

	return json({
		user,
		resource: user ? patchResource(resource, user) : resource,
		suggestions: getSuggestions(list, resource),
	});
}

export const meta: MetaFunction<typeof loader> = ({ params, data }) => {
	return formatMeta({
		title: data.resource.title ?? '',
		description: data.resource.description ?? '',
		'og:url': `https://remix.guide/resources/${params.resourceId}`,
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

export default function ResourcePreview() {
	const { resource, user, suggestions } = useLoaderData<typeof loader>();
	const { message } = useSessionData();
	const location = useLocation();
	const [showBookmark, action] = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const showBookmark = searchParams.get('open') === 'bookmark';

		searchParams.delete('open');

		return [showBookmark, `?${searchParams.toString()}`];
	}, [location.search]);

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
