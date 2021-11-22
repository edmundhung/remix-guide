import type { LoaderFunction, MetaFunction } from 'remix';
import { json, useLoaderData, useFetcher } from 'remix';
import { capitalize, notFound } from '~/helpers';
import { Entry } from '~/types';
import RelatedEntries from '~/components/RelatedEntries';
import { useEffect } from 'react';

export let meta: MetaFunction = ({ data, params }) => {
  return {
    title: `Remix Guide - ${capitalize(params.category)} - ${
      data?.entry?.title
    }`,
  };
};

export let loader: LoaderFunction = async ({ context, params }) => {
  const { category, slug } = params;
  const entry = await context.query(category, slug);

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
    category,
    slug,
    entry,
    alsoFrom: alsoFrom.sort((prev, next) => next.views - prev.views),
    relatedTo: relatedTo.sort((prev, next) => next.views - prev.views),
    builtWith: builtWith.sort((prev, next) => next.views - prev.views),
  });
};

export default function EntryDetail() {
  const marker = useFetcher();
  const { category, slug, entry, alsoFrom, relatedTo, builtWith } =
    useLoaderData<{
      category: string;
      slug: string;
      entry: Entry;
      alsoFrom: Entry[];
      relatedTo: Entry[];
      builtWith: Entry[];
    }>();

  useEffect(() => {
    if (marker.type === 'init') {
      marker.submit(
        {},
        {
          method: 'post',
          action: `/${category}/${slug}/view`,
        }
      );
    }
  }, [marker, category, slug]);

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
            className="hidden relative h-full md:flex flex-col items-center justify-center bg-gray-800"
            href={entry.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="font-light px-8 py-12 text-white">
              <div className="text-xs">Checkout here</div>
              <div className="break-all">{entry.url}</div>
              <div className="pt-4 text-xs">
                This entry has no preview image
              </div>
            </div>
          </a>
        )}
        <div className="mt-4 md:mt-0 lg:col-span-2 md:order-first">
          <section className="p-8 text-xs flex flex-col h-full border">
            <div className="flex flex-row justify-between mb-4">
              <div className="font-light">
                <span className="capitalize">{entry.category}</span>
                {!entry.author ? null : <span> / {entry.author}</span>}
              </div>
              <a
                className="hover:underline"
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                &gt; Open page
              </a>
            </div>
            <h2 className="text-xl flex-grow break-words">{entry.title}</h2>
            <p className="pt-10">{entry.description}</p>
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
