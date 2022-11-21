import type { LoaderArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export function loader({ request }: LoaderArgs) {
	const { searchParams } = new URL(request.url);
	const resourceId = searchParams.get('resourceId');

	searchParams.delete('resourceId');

	const search =
		Array.from(searchParams.keys()).length > 0
			? `?${searchParams.toString()}`
			: '';
	const url = resourceId
		? `/resources/${resourceId}${search}`
		: `/resources${search}`;

	throw redirect(url, 301);
}
