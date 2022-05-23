import type { ActionFunction, LoaderFunction } from '@remix-run/cloudflare';
import { notFound } from '~/helpers';

export let action: ActionFunction = async ({ context }) => {
	return await context.session.logout();
};

export let loader: LoaderFunction = () => {
	return notFound();
};
