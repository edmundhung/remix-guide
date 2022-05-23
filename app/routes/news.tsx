import type { LoaderFunction } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';

export let loader: LoaderFunction = () => {
	throw redirect('/discover');
};
