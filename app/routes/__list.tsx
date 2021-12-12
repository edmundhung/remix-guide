import type {
  HeadersFunction,
  MetaFunction,
  LoaderFunction,
  ShouldReloadFunction,
} from 'remix';
import { Link, Outlet, useLoaderData, useParams, json } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import menuIcon from '~/icons/menu.svg';
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
  const language = url.searchParams.get('language');
  const platform = url.searchParams.get('platform');

  const entries = await store.search(profile?.id ?? null, {
    keyword,
    list,
    categories: category ? [category] : null,
    integrations: platform ? [platform] : null,
    languages: language ? [language] : null,
  });

  return json({
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
        <section className="w-full h-full max-h-screen overflow-y-auto">
          <header className="sticky top-0 backdrop-blur flex items-center gap-2 z-20 px-8 py-4 text-sm">
            <Link
              className="flex xl:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
              to={`?${search === '' ? 'menu' : `${search}&menu`}`}
              prefetch="intent"
            >
              <SvgIcon className="w-3 h-3" href={menuIcon} />
            </Link>
            <div className="flex-1 leading-8 line-clamp-1 capitalize">
              {`${
                new URLSearchParams(search).get('list') ?? 'Latest resources'
              } ${entries.length > 0 ? `(${entries.length})` : ''}`.trim()}
            </div>
            <Link
              className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
              to="/submit"
            >
              <SvgIcon className="w-3 h-3" href={plusIcon} />
            </Link>
          </header>
          {entries.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No entry found at the moment
            </div>
          ) : (
            <div className="px-5 py-3">
              {entries.map((entry) => (
                <article key={entry.slug} className="py-1">
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
                        <span>
                          {`${entry.date ?? new Date().toISOString()}`.substr(
                            0,
                            10
                          )}
                        </span>
                        <span>{entry.author}</span>
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
        </section>
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
