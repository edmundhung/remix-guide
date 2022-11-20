import type { ActionArgs } from '@remix-run/cloudflare';
import { notFound } from '~/helpers';

export async function action({ context }: ActionArgs) {
	return await context.session.logout();
}

export function loader() {
	return notFound();
}
