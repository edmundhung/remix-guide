import { useMemo } from 'react';
import type { LoaderFunction, ShouldReloadFunction } from 'remix';
import { Outlet, useLoaderData, useLocation, json, redirect } from 'remix';
import { search } from '~/bookmarks';
import Feed from '~/components/Feed';
import { notFound } from '~/helpers';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import type { Context, Bookmark } from '~/types';

export let loader: LoaderFunction = async ({ context, request, params }) => {
	const { session, store } = context as Context;
	const profile = await session.isAuthenticated();

	if (params.guide === profile?.name) {
		throw redirect(`${params.guide}/bookmarks`);
	} else if (params.guide !== 'news') {
		throw notFound();
	}

	const searchOptions = getSearchOptions(request.url);
	const bookmarks = await store.getBookmarks(params.guide);
	const entries = search(bookmarks, searchOptions);

	return json({
		entries,
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

export default function Guide() {
	const { entries } = useLoaderData<{ entries: Bookmark[] }>();
	const location = useLocation();
	const bookmarkId = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const resourceId = searchParams.get('bookmarkId');

		return resourceId;
	}, [location.search]);

	return (
		<Feed entries={entries} selectedId={bookmarkId}>
			<Outlet />
		</Feed>
	);
}
