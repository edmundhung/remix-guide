import type { LoaderArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export function loader({ request }: LoaderArgs) {
	const url = new URL(request.url);

	throw redirect(`/${url.search}`, 308);
}
