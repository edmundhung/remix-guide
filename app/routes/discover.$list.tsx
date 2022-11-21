import type { LoaderArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export function loader({ request, params }: LoaderArgs) {
	if (!params.list) {
		throw new Error('params.list is not available');
	}

	const { searchParams } = new URL(request.url);
	const resourceId = searchParams.get('resourceId');

	searchParams.delete('resourceId');

	let url = `/${params.list}`;

	if (resourceId) {
		searchParams.set('list', params.list);
		url = `/resources/${resourceId}?${searchParams}`;
	} else if (Array.from(searchParams.keys()).length > 0) {
		searchParams.set('list', params.list);
		url = `/resources?${searchParams}`;
	}

	throw redirect(url, 301);
}
