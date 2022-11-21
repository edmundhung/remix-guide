import type { LoaderArgs, MetaFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { Outlet, useLoaderData, useLocation } from '@remix-run/react';
import type { ShouldReloadFunction } from '@remix-run/react';
import Feed from '~/components/Feed';
import { search } from '~/resources';
import {
	getRelatedSearchParams,
	getSearchOptions,
	getTitleBySearchOptions,
} from '~/search';
import { formatMeta } from '~/helpers';

export async function loader({ request, context }: LoaderArgs) {
	const profile = await context.session.getUserProfile();
	const searchOptions = getSearchOptions(request.url);

	switch (searchOptions.list) {
		case 'bookmarks':
		case 'history': {
			if (!profile) {
				throw redirect('/');
			}

			const [list, includes] = await Promise.all([
				context.resourceStore.list(),
				context.userStore.getList(profile.id, searchOptions.list ?? null),
			]);

			return json(search(list, { ...searchOptions, list: null, includes }));
		}
		default: {
			const list = await context.resourceStore.list();

			return json(search(list, searchOptions));
		}
	}
}

export const meta: MetaFunction = ({ location }) => {
	const searchOptions = getSearchOptions(
		`${location.pathname}${location.search}`,
	);
	const title = getTitleBySearchOptions(searchOptions);

	return formatMeta({
		title,
	});
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

export default function Resources() {
	const data = useLoaderData<typeof loader>();
	const location = useLocation();
	const [selectedId] = location.pathname.startsWith('/resources/')
		? location.pathname.slice(11).split('/')
		: [];

	return (
		<Feed entries={data.entries} count={data.count} selectedId={selectedId}>
			<Outlet />
		</Feed>
	);
}
