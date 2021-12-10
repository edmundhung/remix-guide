import type { HeadersFunction, LoaderFunction, ActionFunction } from 'remix';
import { Form, Link, json, redirect, useLoaderData } from 'remix';
import { notFound } from '~/helpers';
import { useResourcesSearchParams } from '~/search';
import type { Entry, Context } from '~/types';
import SvgIcon from '~/components/SvgIcon';
import linkIcon from '~/icons/link.svg';
import backIcon from '~/icons/back.svg';
import bookmarkIcon from '~/icons/bookmark.svg';

function getScreenshotURL(url: string): string {
  return `https://cdn.statically.io/screenshot/${url.replace(
    `${new URL(url).protocol}//`,
    ''
  )}`;
}

export let headers: HeadersFunction = ({ loaderHeaders }) => {
  return {
    'Cache-Control': loaderHeaders.get('Cache-Control'),
  };
};

export let action: ActionFunction = async ({ context, params, request }) => {
  const { auth, store } = context as Context;
  const profile = await auth.isAuthenticated();

  if (!profile) {
    return new Response('Unauthorized', { status: 401 });
  }

  await store.bookmark(profile.id, params.id ?? '');

  return redirect(request.headers.get('referrer') ?? request.url);
};

export let loader: LoaderFunction = async ({ context, params }) => {
  const { store } = context as Context;
  const entry = await store.query(params.id ?? '');

  if (!entry) {
    throw notFound();
  }

  return json({
    entry,
  });
};

export default function EntryDetail() {
  const { entry } = useLoaderData<{ entry: Entry }>();
  const searchParams = useResourcesSearchParams();
  const search = searchParams.toString();

  return (
    <section className="w-full h-full max-h-screen overflow-y-auto">
      <header className="sticky top-0 backdrop-blur flex items-center gap-2 z-20 px-8 py-4 text-sm">
        <Link
          className="flex md:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
          to={search === '' ? '/' : `/resources?${search}`}
          prefetch="intent"
          replace
        >
          <SvgIcon className="w-3 h-3" href={backIcon} />
        </Link>
        <div className="flex-1 leading-8 line-clamp-1">{entry.title}</div>
        <Form className="flex flex-row items-center" method="post">
          <button
            type="submit"
            className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
          >
            <SvgIcon className="w-3 h-3" href={bookmarkIcon} />
          </button>
          <label className="px-2">{entry.bookmarkCounts ?? 0}</label>
        </Form>
      </header>
      <div className="px-5 py-3x max-w-screen-xl divide-y">
        <div className="px-3 pt-3 pb-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8 2xl:gap-12">
            <div className="pt-0.5 flex-1">
              <div className="text-xs pb-1.5 text-gray-500">
                {`${entry.date ?? new Date().toISOString()}`.substr(0, 10)}
              </div>
              <div>
                <a
                  className="sticky top-0"
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h2 className="inline-block text-xl break-words">
                    {entry.title}
                  </h2>
                </a>
              </div>
              <a
                className="hover:underline text-gray-400"
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SvgIcon
                  className="inline-block w-3 h-3 mr-2"
                  href={linkIcon}
                />
                {new URL(entry.url).hostname}
              </a>
              {!entry.description ? null : (
                <p className="pt-6 text-gray-500 text-sm">
                  {entry.description}
                </p>
              )}
            </div>
            <div className="lg:max-w-xs w-auto">
              {entry.category === 'videos' && entry.video ? (
                <div className="pt-1 w-full lg:w-64">
                  <div
                    className="relative h-0"
                    style={{ paddingBottom: '56.25%' }}
                  >
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
                </div>
              ) : (
                <a
                  className="relative"
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className="max-h-96 rounded-lg bg-white"
                    src={entry.image ?? getScreenshotURL(entry.url)}
                    width="auto"
                    height="auto"
                    alt="cover"
                  />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="px-3 py-8"></div>
      </div>
    </section>
  );
}
