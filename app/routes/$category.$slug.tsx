import type { LoaderFunction, MetaFunction } from 'remix';
import { json, useLoaderData } from 'remix';
import { capitalize, notFound } from '~/helpers';
import { Entry } from '~/types';
import Card from '~/components/Card';

export let meta: MetaFunction = ({ data, params }) => {
  return {
    title: `Remix Guide - ${capitalize(params.category)} - ${data.entry.title}`,
  };
};

export let loader: LoaderFunction = async ({ context, params }) => {
  let entry = await context.query(params.category, params.slug);

  if (!entry) {
    throw notFound();
  }

  let more = await context.search({
    keyword: entry.title,
  });

  return json({
    entry,
    more,
  });
};

export default function ArticleDetail() {
  const { entry, more } = useLoaderData<{ entry: Entry; more: Entry[] }>();

  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          {entry.category === 'videos' &&
          entry.url.startsWith('https://www.youtube.com/watch?v=') ? (
            <div className="relative h-0" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                width="480"
                height="270"
                src={`https://www.youtube.com/embed/${entry.url.replace(
                  'https://www.youtube.com/watch?v=',
                  ''
                )}`}
                title={entry.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : entry.image ? (
            <a href={entry.url} target="_blank" rel="noopener noreferrer">
              <figure>
                <img src={entry.image} width="100%" alt="cover" />
              </figure>
            </a>
          ) : null}
        </div>
        <div className="lg:col-span-2 md:order-first">
          <section className="p-8 flex flex-col h-full border">
            <div className="flex flex-row justify-between text-xs font-light mb-4">
              <h3 className="capitalize">{entry.category}</h3>
            </div>
            <h2 className="text-xl flex-grow break-words">{entry.title}</h2>
            <p className="text-xs pt-10">{entry.description}</p>
          </section>
        </div>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-masonry pl-px pt-px">
            {more.map((entry) => (
              <Card
                key={entry.slug}
                className="hover:border-black focus:border-black z-0 hover:z-10 focus:z-10 aspect-w-1 aspect-h-1 -ml-px -mt-px"
                slug={entry.slug}
                category={entry.category}
                title={entry.title}
                description={entry.description}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
