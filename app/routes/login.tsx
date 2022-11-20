import type { ActionArgs } from '@remix-run/cloudflare';
import { notFound } from '~/helpers';

export async function loader() {
	return notFound();
}

export async function action({ context }: ActionArgs) {
	return await context.session.login();
}
