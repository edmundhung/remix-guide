import { useMemo } from 'react';
import { LoaderFunction, ShouldReloadFunction, useLocation } from 'remix';
import { Outlet, useLoaderData, json } from 'remix';
import Feed from '~/components/Feed';
import { search } from '~/bookmarks';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import type { Bookmark, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, params, context }) => {
	const { session, store, guideStore } = context as Context;
	const profile = await session.isAuthenticated();
	const searchOptions = getSearchOptions(request.url);
	const guide = params.guide && params.guide === 'news' ? params.guide : null;
	const [bookmarks, includes] = await Promise.all([
		guideStore.getBookmarks('news'),
		store.getList(profile?.id, guide, params.list),
	]);
	const entries = search(bookmarks, {
		...searchOptions,
		includes,
	});

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

export default function List() {
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
