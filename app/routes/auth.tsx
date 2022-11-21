import type { LoaderArgs } from '@remix-run/cloudflare';

export async function loader({ context }: LoaderArgs) {
	return await context.session.login();
}
