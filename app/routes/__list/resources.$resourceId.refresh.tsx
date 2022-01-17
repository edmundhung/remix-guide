import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import { maintainers } from '~/config';
import type { Context } from '~/types';

export let loader: LoaderFunction = async ({ request, context, params }) => {
	const { session, store } = context as Context;
	const profile = await session.isAuthenticated();

	if (!profile || !maintainers.includes(profile.name)) {
		return redirect(`/resources/${params.resourceId}`);
	}

	const userAgent = request.headers.get('User-Agent');

	if (!userAgent) {
		return redirect(`/resources/${params.resourceId}`, {
			headers: await session.commitWithFlashMessage(
				'Refresh failed. User-Agent is missing from the request header',
				'error',
			),
		});
	}

	await store.refresh(profile.id, params.resourceId ?? '', userAgent);

	return redirect(`/resources/${params.resourceId}`, {
		headers: await session.commitWithFlashMessage(
			'Refresh successfull. Be aware that it might take 5 mins before the current cache is expired',
			'success',
		),
	});
};
