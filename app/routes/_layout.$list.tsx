import type { LoaderArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import type { ShouldReloadFunction } from '@remix-run/react';
import Feed from '~/components/Feed';
import { notFound } from '~/helpers';
import { search } from '~/resources';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import About from '~/components/About';

export async function loader({ request, params, context }: LoaderArgs) {
	const { session, resourceStore, userStore } = context;
	const profile = await session.getUserProfile();

	switch (params.list) {
		case 'bookmarks':
		case 'history': {
			if (!profile) {
				throw redirect('/');
			}

			const searchOptions = getSearchOptions(request.url);
			const [list, includes] = await Promise.all([
				resourceStore.list(),
				userStore.getList(profile.id, params.list ?? null),
			]);

			return json(search(list, { ...searchOptions, list: null, includes }));
		}
		default: {
			const searchOptions = getSearchOptions(request.url);
			const guide = await resourceStore.getData();

			if (!guide.metadata.lists?.find((list) => list.slug === params.list)) {
				throw notFound();
			}

			return json(search(guide.value, searchOptions));
		}
	}
}

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
	const { entries, count } = useLoaderData<typeof loader>();

	return (
		<Feed entries={entries} count={count}>
			<About />
		</Feed>
	);
}
