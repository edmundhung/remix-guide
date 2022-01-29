import type { ActionFunction } from 'remix';
import { redirect } from 'remix';
import { Context } from '~/types';

export let action: ActionFunction = async ({ context, request }) => {
	const { session, store } = context as Context;
	const [profile, formData] = await Promise.all([
		session.isAuthenticated(),
		request.formData(),
	]);
	const resourceId = formData.get('resourceId')?.toString();

	if (!resourceId) {
		return new Response('Bad Request', { status: 400 });
	}

	await store.view(profile?.id ?? null, resourceId);

	return redirect(
		formData.get('referer')?.toString() ??
			request.headers.get('referer') ??
			'/',
	);
};
