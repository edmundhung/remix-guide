import { useMemo } from 'react';
import { LoaderFunction, ShouldReloadFunction, useLocation } from 'remix';
import { Outlet, useLoaderData, json } from 'remix';
import Feed from '~/components/Feed';
import { notFound } from '~/helpers';
import { search } from '~/resources';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import type { Resource, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, params, context }) => {
	const { session, resourceStore, userStore } = context as Context;
	const profile = await session.isAuthenticated();

	if (!profile || params.guide !== profile?.name) {
		throw notFound();
	}

	const searchOptions = getSearchOptions(request.url);
	const [list, includes] = await Promise.all([
		resourceStore.list(),
		userStore.getList(profile.id, params.list ?? null),
	]);

	return json(search(list, { ...searchOptions, includes }));
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
