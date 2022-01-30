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
	const url = formData.get('url')?.toString();
	const bookmarkId = formData.get('bookmarkId')?.toString();

	if (!profile) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!url || !bookmarkId) {
		return new Response('Bad Request', { status: 400 });
	}

	switch (type) {
		case 'bookmark':
			await store.bookmark(profile.id, bookmarkId, url);
			break;
		case 'unbookmark':
			await store.unbookmark(profile.id, bookmarkId, url);
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
