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
  const entries = await context.search({
    keyword: url.searchParams.get('q'),
    category: url.searchParams.get('category'),
    version: url.searchParams.get('version'),
    platform: url.searchParams.get('platform'),
  });

  return { entries };
};

export default function Index() {
  let { entries } = useLoaderData<{ entries: Entry[] }>();

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
