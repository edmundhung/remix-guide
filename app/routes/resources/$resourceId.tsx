import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import { getRelatedSearchParams } from '~/search';

export let loader: LoaderFunction = async ({ request, params }) => {
	const url = new URL(request.url);
	const searchParams = getRelatedSearchParams(url.search);

	if (params.resourceId) {
		searchParams.set('resourceId', params.resourceId);
	}

	const search = searchParams.toString();

	throw redirect(search ? `/news?${search}` : '/news');
};
