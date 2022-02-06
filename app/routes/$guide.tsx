import { useMemo } from 'react';
import {
	LoaderFunction,
	redirect,
	ShouldReloadFunction,
	useLocation,
} from 'remix';
import { Outlet, useLoaderData, json } from 'remix';
import Feed from '~/components/Feed';
import { notFound } from '~/helpers';
import { search } from '~/resources';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import type { ResourceMetadata, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, params, context }) => {
	const { session, resourceStore } = context as Context;
	const profile = await session.isAuthenticated();

	if (params.guide === profile?.name) {
		throw redirect(`${params.guide}/bookmarks`);
	}

	if (params.guide !== 'news') {
		throw notFound();
	}

	const searchOptions = getSearchOptions(request.url);
	const resources = await resourceStore.listResources();

	return json({
		entries: search(resources, searchOptions),
	});
};

export const unstable_shouldReload: ShouldReloadFunction = ({
	url,
	prevUrl,
}) => {
	const nextSearch = getRelatedSearchParams(url.search).toString();
	const prevSearch = getRelatedSearchParams(prevUrl.search).toString();

	return nextSearch !== prevSearch;
};

export default function List() {
	const { entries } = useLoaderData<{ entries: ResourceMetadata[] }>();
	const location = useLocation();
	const resourceId = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const resourceId = searchParams.get('resourceId');

		return resourceId;
	}, [location.search]);

	return (
		<Feed entries={entries} selectedId={resourceId}>
			<Outlet />
		</Feed>
	);
}
