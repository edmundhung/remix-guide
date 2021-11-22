import type { HeadersFunction, LoaderFunction } from 'remix';
import { useLoaderData, json } from 'remix';
import Card from '~/components/Card';
import type { Entry } from '~/types';

export let headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    'Cache-Control': loaderHeaders.get('Cache-Control'),
  };
};

export let loader: LoaderFunction = async ({ context }) => {
  const entries = await context.search();

  if (!entries || entries.length === 0) {
    throw new Error('Something went wrong');
  }

  return json(
    {
      entries: entries.sort((prev, next) => next.views - prev.views),
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

  return (
    <>
      <div className="px-8 py-4">
        <h1 className="font-light text-xl">Remix Guide</h1>
        <div>An interactive list of awesome stuffs about Remix</div>
        <div className="pt-4 text-xs">
          <sup>*</sup> Everything shared here are mostly made by the community
          only
        </div>
      </div>
      <section>
        <div className="sticky top-12 bg-white z-20 px-8 py-4 mb-8 border-b text-sm text-gray-500">
          Remix v1 is finally here! Check out the{' '}
          <a
            className="underline"
            href="https://docs.remix.run"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs
          </a>{' '}
          to get started
        </div>
        <div className="grid grid-cols-masonry pl-px pt-px">
          {entries.map((entry) => (
            <Card
              key={entry.slug}
              className="hover:border-black focus:border-black z-0 hover:z-10 focus:z-10 sm:aspect-w-1 sm:aspect-h-1 -ml-px -mt-px"
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
    </>
  );
}
