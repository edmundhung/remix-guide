import { useMemo } from 'react';
import { LoaderFunction, ShouldReloadFunction, useLocation } from 'remix';
import { Outlet, useLoaderData, json } from 'remix';
import Feed from '~/components/Feed';
import { getRelatedSearchParams, getSearchOptions } from '~/search';
import type { ResourceMetadata, Context } from '~/types';

export let loader: LoaderFunction = async ({ request, context }) => {
  const { session, store } = context as Context;
  const profile = await session.isAuthenticated();
  const searchOptions = getSearchOptions(request.url);
  const entries = await store.search(profile?.id ?? null, searchOptions);

  return json({
    entries,
  });
};

export const unstable_shouldReload: ShouldReloadFunction = ({
  url,
  prevUrl,
}) => {
  const nextSearch = getRelatedSearchParams(url.search).toString();
  const prevSearch = getRelatedSearchParams(prevUrl.search).toString();

  return nextSearch !== prevSearch;
};

export default function List() {
  const { entries } = useLoaderData<{ entries: ResourceMetadata[] }>();
  const location = useLocation();
  const resourceId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const resourceId = searchParams.get('resourceId');

    return resourceId;
  }, [location.search]);

  return (
    <Feed entries={entries} selectedId={resourceId}>
      <Outlet />
    </Feed>
  );
}
