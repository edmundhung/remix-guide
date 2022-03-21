import { useMemo } from 'react';
import type { LoaderFunction, ShouldReloadFunction } from 'remix';
import { Outlet, useLoaderData, useLocation, json, redirect } from 'remix';
import Feed from '~/components/Feed';
import { notFound } from '~/helpers';
import { search } from '~/resources';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import type { Resource, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, params, context }) => {
	const { session, resourceStore } = context as Context;
	const profile = await session.isAuthenticated();

	if (params.guide === profile?.name) {
		throw redirect(`${params.guide}/bookmarks`);
	}

	if (params.guide !== 'discover') {
		throw notFound();
	}

	const searchOptions = getSearchOptions(request.url);
	const list = await resourceStore.list();

	return json(search(list, searchOptions));
};

export const unstable_shouldReload: ShouldReloadFunction = ({
	url,
	prevUrl,
	submission,
}) => {
	const nextSearch = getRelatedSearchParams(url.search).toString();
	const prevSearch = getRelatedSearchParams(prevUrl.search).toString();

	return (
		nextSearch !== prevSearch ||
		['update', 'delete'].includes(
			submission?.formData.get('type')?.toString() ?? '',
		)
	);
};

export default function List() {
	const { entries, count } =
		useLoaderData<{ entries: Resource[]; count: number }>();
	const location = useLocation();
	const resourceId = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const resourceId = searchParams.get('resourceId');

		return resourceId;
	}, [location.search]);

	return (
		<Feed entries={entries} count={count} selectedId={resourceId}>
			<Outlet />
		</Feed>
	);
}
