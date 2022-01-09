import type { LoaderFunction, ShouldReloadFunction } from 'remix';
import { useMemo } from 'react';
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useParams,
  json,
} from 'remix';
import clsx from 'clsx';
import Card from '~/components/Card';
import SvgIcon from '~/components/SvgIcon';
import { capitalize } from '~/helpers';
import plusIcon from '~/icons/plus.svg';
import { getResourcesSearchParams, getSearchOptions } from '~/search';
import type { Resource, Context } from '~/types';
import { maintainers } from '~/config';
import MenuLink from '~/components/MenuLink';
import { PaneContainer, PaneHeader, PaneContent } from '~/layout';

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
    useLoaderData<{ entries: Resource[]; submitEnabled: boolean }>();
  const location = useLocation();
  const searchParams = useMemo(
    () => getResourcesSearchParams(location.search),
    [location.search]
  );
  const params = useParams();
  const list = searchParams.get('list');
  const resourceSelected = typeof params.resourceId !== 'undefined';

  return (
    <div className="h-full flex flex-col-reverse lg:flex-row">
      <div
        className={clsx('lg:border-r w-full lg:w-96', {
          'hidden lg:block': resourceSelected,
        })}
      >
        <PaneContainer>
          <PaneHeader>
            <MenuLink />
            <div className="flex-1 leading-8 line-clamp-1 text-center lg:text-left">
              {capitalize(list) ?? 'Discover'}
            </div>
            {list === null && submitEnabled ? (
              <Link
                className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
                to="/submit"
              >
                <SvgIcon className="w-3 h-3" href={plusIcon} />
              </Link>
            ) : null}
          </PaneHeader>
          <PaneContent>
            {entries.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                No resources found at the moment
              </div>
            ) : (
              <div>
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    entry={entry}
                    search={searchParams.toString()}
                    selected={params.resourceId === entry.id}
                  />
                ))}
              </div>
            )}
          </PaneContent>
        </PaneContainer>
      </div>
      <div className={clsx('flex-1', { 'hidden lg:block': !resourceSelected })}>
        <Outlet />
      </div>
    </div>
  );
}
