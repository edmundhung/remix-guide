import type { LoaderFunction } from '@remix-run/cloudflare';

export let loader: LoaderFunction = async ({ context }) => {
	return await context.session.login();
};
