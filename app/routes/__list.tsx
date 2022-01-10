import type { LoaderFunction, ShouldReloadFunction } from 'remix';
import { useMemo } from 'react';
import { Outlet, useLoaderData, useLocation, useParams, json } from 'remix';
import clsx from 'clsx';
import { getResourcesSearchParams, getSearchOptions } from '~/search';
import type { ResourceMetadata, Context } from '~/types';
import { maintainers } from '~/config';
import ResourcesList from '~/components/ResourcesList';
import SearchList from '~/components/SearchList';

export let loader: LoaderFunction = async ({ request, context }) => {
  const { session, store } = context as Context;
  const profile = await session.isAuthenticated();
  const url = new URL(request.url);
  const searchParams = getResourcesSearchParams(url.search);
  const searchOptions = getSearchOptions(searchParams);
  const entries = await store.search(profile?.id ?? null, searchOptions);

  return json({
    submitEnabled: profile && maintainers.includes(profile.name),
    entries,
  });
};

export const unstable_shouldReload: ShouldReloadFunction = ({
  url,
  prevUrl,
}) => {
  return url.searchParams.toString() !== prevUrl.searchParams.toString();
};

export default function List() {
  const { entries, submitEnabled } =
    useLoaderData<{ entries: ResourceMetadata[]; submitEnabled: boolean }>();
  const location = useLocation();
  const searchParams = useMemo(
    () => getResourcesSearchParams(location.search),
    [location.search]
  );
  const isSearching = searchParams.get('open') === 'search';
  const params = useParams();
  const resourceSelected = typeof params.resourceId !== 'undefined';

  return (
    <div className="h-full flex flex-row">
      <div
        className={clsx('lg:border-r w-full lg:w-96', {
          'hidden lg:block': resourceSelected,
        })}
      >
        {isSearching ? (
          <SearchList searchParams={searchParams} />
        ) : (
          <ResourcesList
            entries={entries}
            searchParams={searchParams}
            selectedResourceId={params.resourceId}
            submitEnabled={submitEnabled}
          />
        )}
      </div>
      <div className={clsx('flex-1', { 'hidden lg:block': !resourceSelected })}>
        <Outlet />
      </div>
    </div>
  );
}
