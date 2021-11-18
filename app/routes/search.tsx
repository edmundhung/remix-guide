import type { MetaFunction, LoaderFunction } from 'remix';
import { useLoaderData } from 'remix';
import Card from '~/components/Card';

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Guide - Search',
    description:
      'Starter template for setting up a Remix app on Cloudflare Workers',
  };
};

export let loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const entries = context.search({
    keyword: url.searchParams.get('q'),
    category: url.searchParams.get('category'),
    version: url.searchParams.get('version'),
    platform: url.searchParams.get('platform'),
  });

  return { entries };
};

export default function Index() {
  let { entries } = useLoaderData();

  return (
    <div className="grid grid-cols-masonry pl-px pt-px">
      {entries.map((entry) => (
        <Card
          key={entry.id}
          className="-ml-px -mt-px"
          url={entry.url}
          type={entry.type}
          title={entry.title}
          description={entry.description}
          image={entry.image}
          tags={entry.tags}
        />
      ))}
    </div>
  );
}
