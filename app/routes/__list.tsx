import type { LoaderFunction, ShouldReloadFunction } from 'remix';
import { Outlet, useLoaderData, useParams, json } from 'remix';
import Feed from '~/components/Feed';
import { getSearchOptions } from '~/search';
import type { ResourceMetadata, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, context }) => {
	const { session, store } = context as Context;
	const profile = await session.isAuthenticated();
	const searchOptions = getSearchOptions(request.url);
	const entries = await store.search(profile?.id ?? null, searchOptions);

	return json({
		entries,
	});
};

export const unstable_shouldReload: ShouldReloadFunction = ({
	url,
	prevUrl,
}) => {
	return url.searchParams.toString() !== prevUrl.searchParams.toString();
};

export default function ListRoute() {
	const { entries } = useLoaderData<{ entries: ResourceMetadata[] }>();
	const { resourceId } = useParams();

	return (
		<Feed entries={entries} selectedId={resourceId}>
			<Outlet />
		</Feed>
	);
}
