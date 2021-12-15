import type {
  HeadersFunction,
  LoaderFunction,
  ActionFunction,
  ShouldReloadFunction,
} from 'remix';
import { Form, json, redirect, useLoaderData, useFetcher } from 'remix';
import { useEffect } from 'react';
import { notFound } from '~/helpers';
import type { Entry, Context } from '~/types';
import SvgIcon from '~/components/SvgIcon';
import linkIcon from '~/icons/link.svg';
import bookmarkIcon from '~/icons/bookmark.svg';
import Panel from '~/components/Panel';

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

  const formData = await request.formData();
  const type = formData.get('type');

  switch (type) {
    case 'bookmark':
      await store.bookmark(profile.id, params.id ?? '');
      return redirect(request.headers.get('referrer') ?? request.url);
    case 'unbookmark':
      await store.unbookmark(profile.id, params.id ?? '');
      return redirect(request.headers.get('referrer') ?? request.url);
    case 'view':
      await store.view(profile.id, params.id ?? '');
      return new Response('OK', { status: 200 });
  }
};

export let loader: LoaderFunction = async ({ context, params }) => {
  const { auth, store } = context as Context;
  const [entry, user, [message, setCookieHeader]] = await Promise.all([
    store.query(params.id ?? ''),
    (async () => {
      const profile = await auth.isAuthenticated();

      if (!profile) {
        return null;
      }

      return await store.getUser(profile.id);
    })(),
    auth.getFlashMessage(),
  ]);

  if (!entry) {
    throw notFound();
  }

  return json(
    {
      entry,
      authenticated: user !== null,
      bookmarked: user?.bookmarked.includes(entry.id),
      message,
    },
    {
      headers: setCookieHeader,
    }
  );
};

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  return typeof submission === 'undefined';
};

export default function EntryDetail() {
  const { submit } = useFetcher();
  const { entry, authenticated, bookmarked, message } = useLoaderData<{
    entry: Entry;
    authenticated: boolean;
    bookmarked: boolean;
  }>();

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    submit({ type: 'view' }, { method: 'post' });
  }, [submit, authenticated, entry.id]);

  return (
    <Panel
      title={entry.title}
      type="details"
      message={message}
      elements={
        <Form className="flex flex-row items-center" method="post">
          <input
            type="hidden"
            name="type"
            value={bookmarked ? 'unbookmark' : 'bookmark'}
          />
          <button
            type="submit"
            className={`flex items-center justify-center w-6 h-6 ${
              bookmarked
                ? 'rounded-full text-red-500 bg-gray-200'
                : 'hover:rounded-full hover:bg-gray-200 hover:text-black'
            }`}
          >
            <SvgIcon className="w-3 h-3" href={bookmarkIcon} />
          </button>
          <label className="px-2 w-10 text-right">
            {entry.bookmarkCounts ?? 0}
          </label>
        </Form>
      }
    >
      <div className="max-w-screen-xl divide-y">
        <div className="px-3 pt-3 pb-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8 2xl:gap-12">
            <div className="pt-0.5 flex-1">
              <div className="text-xs pb-1.5 text-gray-500">
                {entry.createdAt.substr(0, 10)}
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
              {entry.video ? (
                <div className="pt-1 w-full lg:w-72">
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      width="720"
                      height="405"
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
    </Panel>
  );
}
