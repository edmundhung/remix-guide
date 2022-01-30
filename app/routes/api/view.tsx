import type { ActionFunction } from 'remix';
import { redirect } from 'remix';
import { Context } from '~/types';

export let action: ActionFunction = async ({ context, request }) => {
	const { session, userStore } = context as Context;
	const [profile, formData] = await Promise.all([
		session.isAuthenticated(),
		request.formData(),
	]);
	const url = formData.get('url')?.toString();
	const bookmarkId = formData.get('bookmarkId')?.toString();

	if (!url || !bookmarkId) {
		return new Response('Bad Request', { status: 400 });
	}

	await userStore.view(profile?.id ?? null, bookmarkId, url);

	return redirect(
		formData.get('referer')?.toString() ??
			request.headers.get('referer') ??
			'/',
	);
};
