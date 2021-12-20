import type { MetaFunction, LoaderFunction, ShouldReloadFunction } from 'remix';
import { useMemo } from 'react';
import {
  Link,
  Outlet,
  useLoaderData,
  useLocation,
  useParams,
  json,
} from 'remix';
import Card from '~/components/Card';
import Panel from '~/components/Panel';
import SvgIcon from '~/components/SvgIcon';
import { capitalize } from '~/helpers';
import plusIcon from '~/icons/plus.svg';
import { getResourcesSearchParams, getSearchOptions } from '~/search';
import type { Resource, Context } from '~/types';

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Guide - Search',
  };
};

export let loader: LoaderFunction = async ({ request, context }) => {
  const { session, store } = context as Context;
  const profile = await session.isAuthenticated();
  const url = new URL(request.url);
  const searchOptions = getSearchOptions(url.search);
  const entries = await store.search(profile?.id ?? null, searchOptions);

  return json({
    entries,
  });
};

export const unstable_shouldReload: ShouldReloadFunction = ({
  url,
  prevUrl,
}) => {
  return (
    !prevUrl.pathname.startsWith('/resources') ||
    url.searchParams.toString() !== prevUrl.searchParams.toString()
  );
};

export default function List() {
  const { entries } = useLoaderData<{ entries: Resource[] }>();
  const location = useLocation();
  const searchParams = useMemo(
    () => getResourcesSearchParams(location.search),
    [location.search]
  );
  const params = useParams();
  const list = searchParams.get('list');

  return (
    <div className="h-full flex">
      <div
        className={`md:border-r w-full md:w-72 lg:w-80 xl:w-96 ${
          params.resourceId ? 'hidden md:block' : ''
        }`}
      >
        <Panel
          title={`${capitalize(list) ?? 'Latest Resources'} ${
            entries.length > 0 ? `(${entries.length})` : ''
          }`.trim()}
          type="list"
          elements={
            list === null ? (
              <Link
                className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
                to="/submit"
              >
                <SvgIcon className="w-3 h-3" href={plusIcon} />
              </Link>
            ) : null
          }
        >
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
        </Panel>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
