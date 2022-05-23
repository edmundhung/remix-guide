import type { LoaderFunction } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { getRelatedSearchParams } from '~/search';

export let loader: LoaderFunction = async ({ request, params }) => {
	const url = new URL(request.url);
	const searchParams = getRelatedSearchParams(url.search);

	if (params.resourceId) {
		searchParams.set('resourceId', params.resourceId);
	}

	const search = searchParams.toString();

	throw redirect(search ? `/discover?${search}` : '/discover');
};
