import type { HeadersFunction, MetaFunction, LoaderFunction } from 'remix';
import { useLoaderData, json } from 'remix';
import Card from '~/components/Card';
import type { Entry } from '~/types';

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
  const url = new URL(request.url);
  const keyword = url.searchParams.get('q') ?? '';
  const category = url.searchParams.get('category');
  const language = url.searchParams.get('language');
  const version = url.searchParams.get('version');
  const platform = url.searchParams.get('platform');

  const entries = await context.search({
    keyword,
    categories: category ? [category] : null,
    version,
    platform,
    language,
  });

  return json(
    {
      entries:
        keyword === ''
          ? entries.sort((prev, next) => next.views - prev.views)
          : entries,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    }
  );
};

export default function Index() {
  let { entries } = useLoaderData<{ entries: Entry[] }>();

  if (entries.length === 0) {
    return (
      <div className="text-center pt-8 text-gray-500">
        No entry found at the moment
      </div>
    );
  }

  return (
    <section>
      <div className="sticky top-12 bg-white dark:bg-black z-20 px-8 py-4 mb-8 border-b dark:border-b-gray-600 text-sm text-gray-500">
        Showing {entries.length > 1 ? `${entries.length} entries` : '1 entry'}
      </div>
      <div className="grid grid-cols-masonry pl-px pt-px">
        {entries.map((entry) => (
          <Card
            key={entry.slug}
            className="hover:border-black dark:hover:border-gray-200 dark:hover:text-gray-400 z-0 hover:z-10 focus:z-10 sm:aspect-w-1 sm:aspect-h-1 -ml-px -mt-px"
            slug={entry.slug}
            author={entry.author}
            category={entry.category}
            title={entry.title}
            description={entry.description}
            views={entry.views}
          />
        ))}
      </div>
    </section>
  );
}
