import type { ActionFunction } from 'remix';
import { redirect } from 'remix';
import { maintainers } from '~/config';
import type { Context } from '~/types';

export let action: ActionFunction = async ({ context, request }) => {
	const { session, store } = context as Context;
	const [profile, formData] = await Promise.all([
		session.isAuthenticated(),
		request.formData(),
	]);
	const url = formData.get('url')?.toString();

	if (!profile) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!maintainers.includes(profile.name)) {
		return new Response('Forbidden', { status: 403 });
	}

	if (!url) {
		return new Response('Bad Request', { status: 400 });
	}

	await store.refresh(url);

	return redirect(
		formData.get('referer')?.toString() ??
			request.headers.get('referer') ??
			'/',
		{
			headers: await session.commitWithFlashMessage(
				'Refresh successfull. Be aware that new content will be populated only after the cache is expired',
				'success',
			),
		},
	);
};
