import type { ActionFunction } from 'remix';
import { redirect } from 'remix';
import { Context } from '~/types';

export let action: ActionFunction = async ({ context, request }) => {
	const { session, store } = context as Context;
	const [profile, formData] = await Promise.all([
		session.isAuthenticated(),
		request.formData(),
	]);
	const type = formData.get('type');
	const resourceId = formData.get('resourceId')?.toString();

	if (!profile) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!resourceId) {
		return new Response('Bad Request', { status: 400 });
	}

	switch (type) {
		case 'bookmark':
			await store.bookmark(profile.id, resourceId);
			break;
		case 'unbookmark':
			await store.unbookmark(profile.id, resourceId);
			break;
		default:
			return new Response('Bad Request', { status: 400 });
	}

	return redirect(
		formData.get('referer')?.toString() ??
			request.headers.get('referer') ??
			'/',
	);
};
