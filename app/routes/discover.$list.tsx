import type { LoaderArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export function loader({ request, params }: LoaderArgs) {
	const url = new URL(request.url);

	throw redirect(`/${params.list}${url.search}`, 308);
}
