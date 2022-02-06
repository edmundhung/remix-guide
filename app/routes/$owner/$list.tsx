import { useMemo } from 'react';
import { LoaderFunction, ShouldReloadFunction, useLocation } from 'remix';
import { Outlet, useLoaderData, json } from 'remix';
import Feed from '~/components/Feed';
import { search } from '~/resources';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import type { ResourceMetadata, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, context }) => {
	const { session, resourceStore, userStore } = context as Context;
	const profile = await session.isAuthenticated();

	if (!profile) {
		return new Response('Unauthorized', { status: 401 });
	}

	const searchOptions = getSearchOptions(request.url);
	const [resources, includes] = await Promise.all([
		resourceStore.listResources(),
		userStore.getList(profile.id, searchOptions.list ?? null),
	]);

	return json({
		entries: search(resources, { ...searchOptions, includes }),
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
