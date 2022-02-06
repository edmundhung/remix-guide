import type { LoaderFunction, ShouldReloadFunction } from 'remix';
import { Outlet, useLoaderData, useParams, json } from 'remix';
import Feed from '~/components/Feed';
import { search } from '~/resources';
import { getSearchOptions } from '~/search';
import type { ResourceMetadata, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, context }) => {
	const { resourceStore } = context as Context;
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
