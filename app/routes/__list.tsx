import type { LoaderFunction, ShouldReloadFunction } from 'remix';
import { useMemo } from 'react';
import { Outlet, useLoaderData, useLocation, useParams, json } from 'remix';
import clsx from 'clsx';
import { getSearchOptions } from '~/search';
import type { ResourceMetadata, Context } from '~/types';
import { maintainers } from '~/config';
import ResourcesList from '~/components/ResourcesList';
import SearchList from '~/components/SearchList';

export let loader: LoaderFunction = async ({ request, context }) => {
  const { session, store } = context as Context;
  const profile = await session.isAuthenticated();
  const searchOptions = getSearchOptions(request.url);
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
  const nextSearch = new URLSearchParams(url.searchParams);
  const prevSearch = new URLSearchParams(prevUrl.searchParams);

  nextSearch.delete('resourceId');
  prevSearch.delete('resourceId');

  return nextSearch.toString() !== prevSearch.toString();
};

export default function List() {
  const { entries, submitEnabled } =
    useLoaderData<{ entries: ResourceMetadata[]; submitEnabled: boolean }>();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const searchOptions = getSearchOptions(
    `${location.pathname}${location.search}`
  );
  const isSearching = searchParams.get('open') === 'search';
  const params = useParams();
  const resourceId = searchOptions.list
    ? searchParams.get('resourceId')
    : params.resourceId;
  const resourceSelected =
    typeof resourceId !== 'undefined' && resourceId !== null;

  return (
    <div className="h-full flex flex-row">
      <div
        className={clsx('lg:border-r w-full lg:w-96', {
          'hidden lg:block': resourceSelected,
        })}
      >
        {isSearching ? (
          <SearchList
            searchOptions={searchOptions}
            selectedResourceId={resourceId}
          />
        ) : (
          <ResourcesList
            entries={entries}
            searchOptions={searchOptions}
            selectedResourceId={resourceId}
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
