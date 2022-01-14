import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import { notFound } from '~/helpers';
import type { Context } from '~/types';

export let loader: LoaderFunction = async ({ context, params }) => {
  const { session } = context as Context;
  const profile = await session.isAuthenticated();

  if (!profile || profile.name !== params.owner) {
    throw notFound();
  }

  throw redirect(`${params.owner}/bookmarks`);
};
