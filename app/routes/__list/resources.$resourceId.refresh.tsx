import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import type { Context } from '~/types';

export let loader: LoaderFunction = async ({ request, context, params }) => {
  const { session, store } = context as Context;
  const profile = await session.isAuthenticated();

  if (!profile) {
    return redirect(`/resources/${params.resourceId}`);
  }

  await store.refresh(
    profile.id,
    params.resourceId ?? '',
    request.headers.get('User-Agent')
  );

  return redirect(`/resources/${params.resourceId}`, {
    headers: await session.commitWithFlashMessage(
      'Refresh successfull. Be aware that it might take 5 mins before the current cache is expired',
      'success'
    ),
  });
};
