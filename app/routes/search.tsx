import type { MetaFunction, LoaderFunction } from 'remix';
import { useLoaderData } from 'remix';
import Card from '~/components/Card';
import type { Entry } from '~/types';

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Guide - Search',
    description:
      'Starter template for setting up a Remix app on Cloudflare Workers',
  };
};

export let loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('q');
  const category = url.searchParams.get('category');
  const version = url.searchParams.get('version');
  const platform = url.searchParams.get('platform');

  const entries = await context.search({
    keyword,
    categories: category ? [category] : null,
    version,
    platform,
  });

  return { entries };
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
    <div className="grid grid-cols-masonry pl-px pt-px">
      {entries.map((entry) => (
        <Card
          key={entry.slug}
          className="hover:border-black focus:border-black z-0 hover:z-10 focus:z-10 sm:aspect-w-1 sm:aspect-h-1 -ml-px -mt-px"
          slug={entry.slug}
          category={entry.category}
          title={entry.title}
          description={entry.description}
        />
      ))}
    </div>
  );
}
