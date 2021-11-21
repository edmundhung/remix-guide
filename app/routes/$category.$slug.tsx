import type { LoaderFunction, MetaFunction } from 'remix';
import { json, useLoaderData } from 'remix';
import { capitalize, notFound } from '~/helpers';
import { Entry } from '~/types';
import RelatedEntries from '~/components/RelatedEntries';

export let meta: MetaFunction = ({ data, params }) => {
  return {
    title: `Remix Guide - ${capitalize(params.category)} - ${
      data?.entry?.title
    }`,
  };
};

export let loader: LoaderFunction = async ({ context, params }) => {
  const entry = await context.query(params.category, params.slug);

  if (!entry) {
    throw notFound();
  }

  const [alsoFrom, relatedTo, builtWith] = await Promise.all([
    context.search({ author: entry.author }),
    entry.category === 'packages'
      ? context.search({
          packageName: entry.title,
          categories: ['articles', 'videos'],
        })
      : [],
    entry.category === 'packages'
      ? context.search({
          packageName: entry.title,
          categories: ['packages', 'templates', 'examples'],
        })
      : [],
  ]);

  return json({
    entry,
    alsoFrom,
    relatedTo,
    builtWith,
  });
};

export default function ArticleDetail() {
  const { entry, alsoFrom, relatedTo, builtWith } = useLoaderData<{
    entry: Entry;
    alsoFrom: Entry[];
    relatedTo: Entry[];
    builtWith: Entry[];
  }>();

  return (
    <div className="max-w-screen-xl">
      <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {entry.category === 'videos' && entry.video ? (
          <div className="relative h-0" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              width="480"
              height="270"
              src={entry.video}
              title={entry.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : entry.image ? (
          <a
            className="relative h-full flex flex-col justify-center"
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={entry.image} width="100%" height="auto" alt="cover" />
          </a>
        ) : (
          <a
            className="relative h-full flex flex-col items-center justify-center bg-gray-800"
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="font-light px-8 py-12 text-white">
              <div className="flex flex-grow flex-row items-center ">
                <div className="bg-white text-black p-2 w-12 h-12 mx-auto text-xs flex text-center items-center justify-center mr-4">
                  Remix Guide
                </div>
                <div>{entry.title}</div>
              </div>
              <div className="pt-4 text-xs">{entry.url}</div>
            </div>
          </a>
        )}
        <div className="mt-4 md:mt-0 lg:col-span-2 md:order-first">
          <section className="p-8 flex flex-col h-full border">
            <div className="flex flex-row justify-between text-xs font-light mb-4">
              <h3 className="capitalize">{entry.category}</h3>
            </div>
            <h2 className="text-xl flex-grow break-words">{entry.title}</h2>
            <p className="text-xs pt-10">{entry.description}</p>
          </section>
        </div>
      </div>
      {entry.category === 'packages' ? (
        <>
          <div className="mt-4">
            <RelatedEntries
              title={`Related to ${entry.title}`}
              entries={relatedTo.filter((e) => e.url !== entry.url)}
            />
          </div>
          <div className="mt-4">
            <RelatedEntries
              title={`Built with ${entry.title}`}
              entries={builtWith.filter((e) => e.url !== entry.url)}
            />
          </div>
        </>
      ) : null}
      <div className="mt-4">
        <RelatedEntries
          title={`Also from ${entry.author}`}
          entries={alsoFrom.filter((e) => e.url !== entry.url)}
        />
      </div>
    </div>
  );
}
