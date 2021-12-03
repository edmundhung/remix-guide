import type { HeadersFunction, MetaFunction, LoaderFunction } from 'remix';
import { Outlet, useLoaderData, useParams, json } from 'remix';
import SearchList from '~/components/SearchList';
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
  const { store } = context as Context;
  const url = new URL(request.url);
  const keyword = url.searchParams.get('q') ?? '';
  const category = url.searchParams.get('category');
  const language = url.searchParams.get('language');
  const platform = url.searchParams.get('platform');

  const entries = await store.search({
    keyword,
    categories: category ? [category] : null,
    integrations: platform ? [platform] : null,
    languages: language ? [language] : null,
  });

  return json(
    {
      entries,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
};

export default function List() {
  let { entries } = useLoaderData<{ entries: Entry[] }>();
  let params = useParams();

  return (
    <div className="h-full flex">
      <div
        className={`md:border-r w-auto md:w-72 lg:w-80 xl:w-96 ${
          params.id ? 'hidden md:block' : ''
        }`}
      >
        <SearchList entries={entries} currentId={params.id ?? null} />
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
