import type { LoaderFunction } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { getRelatedSearchParams } from '~/search';

export let loader: LoaderFunction = async ({ request }) => {
	const url = new URL(request.url);
	const searchParams = getRelatedSearchParams(url.search);
	const search = searchParams.toString();

	throw redirect(search ? `/discover?${search}` : '/discover');
};
