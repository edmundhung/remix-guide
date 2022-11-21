import type { LoaderArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import About from '~/components/About';
import Feed from '~/components/Feed';
import { search } from '~/resources';
import { getSearchOptions } from '~/search';

export async function loader({ request, context }: LoaderArgs) {
	const searchOptions = getSearchOptions(request.url);
	const list = await context.resourceStore.list();

	return json(search(list, searchOptions));
}

export default function Index() {
	const { entries, count } = useLoaderData<typeof loader>();

	return (
		<Feed entries={entries} count={count}>
			<About />
		</Feed>
	);
}
