import type {
  HeadersFunction,
  MetaFunction,
  LoaderFunction,
  ShouldReloadFunction,
} from 'remix';
import { Link, Outlet, useLoaderData, useParams, json } from 'remix';
import Panel from '~/components/Panel';
import SvgIcon from '~/components/SvgIcon';
import { capitalize } from '~/helpers';
import plusIcon from '~/icons/plus.svg';
import { useResourcesSearch } from '~/search';
import type { Entry, Context } from '~/types';

export let headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    'Cache-Control': loaderHeaders.get('Cache-Control'),
  };
};

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Guide - Search',
  };
};

export let loader: LoaderFunction = async ({ request, context }) => {
  const { auth, store } = context as Context;
  const profile = await auth.isAuthenticated();
  const url = new URL(request.url);
  const keyword = url.searchParams.get('q') ?? '';
  const list = url.searchParams.get('list');
  const category = url.searchParams.get('category');
  const platform = url.searchParams.get('platform');
  const integrations = url.searchParams.getAll('integration');

  const entries = await store.search(profile?.id ?? null, {
    keyword,
    list,
    categories: category ? [category] : [],
    integrations: integrations.concat(platform ? [platform] : []),
  });

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
  let { entries } = useLoaderData<{ entries: Entry[] }>();
  const search = useResourcesSearch();
  const params = useParams();

  return (
    <div className="h-full flex">
      <div
        className={`md:border-r w-full md:w-72 lg:w-80 xl:w-96 ${
          params.id ? 'hidden md:block' : ''
        }`}
      >
        <Panel
          title={`${
            capitalize(new URLSearchParams(search).get('list')) ??
            'Latest resources'
          } ${entries.length > 0 ? `(${entries.length})` : ''}`.trim()}
          type="list"
          elements={
            <Link
              className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
              to="/submit"
            >
              <SvgIcon className="w-3 h-3" href={plusIcon} />
            </Link>
          }
        >
          {entries.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No entry found at the moment
            </div>
          ) : (
            <div>
              {entries.map((entry) => (
                <article key={entry.id} className="py-1">
                  <Link
                    className={`block rounded-lg no-underline ${
                      params.id === entry.id
                        ? 'shadow-inner bg-gray-800'
                        : 'hover:shadow-inner hover:bg-gray-900'
                    }`}
                    to={`/resources/${entry.id}?${search}`}
                    prefetch="intent"
                  >
                    <section className="px-3 py-2.5 text-sm">
                      <div className="text-xs pb-1.5 text-gray-500 flex flex-row justify-between">
                        <span>{entry.createdAt.substr(0, 10)}</span>
                        <span>{new URL(entry.url).hostname}</span>
                      </div>
                      <h2 className="break-words line-clamp-2">
                        {entry.title}
                      </h2>
                      {!entry.description ? null : (
                        <p className="pt-1 text-gray-400 line-clamp-2">
                          {entry.description}
                        </p>
                      )}
                    </section>
                  </Link>
                </article>
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
