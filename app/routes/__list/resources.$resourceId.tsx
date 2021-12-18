import type {
  LoaderFunction,
  ActionFunction,
  ShouldReloadFunction,
} from 'remix';
import { Form, json, redirect, useLoaderData, useFetcher } from 'remix';
import { ReactElement, useEffect } from 'react';
import { notFound } from '~/helpers';
import type {
  Context,
  Resource,
  ResourceMetadata,
  SearchOptions,
} from '~/types';
import Card from '~/components/Card';
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

export let action: ActionFunction = async ({ context, params, request }) => {
  const { session, store } = context as Context;
  const profile = await session.isAuthenticated();
  const formData = await request.formData();
  const type = formData.get('type');

  if (type === 'view') {
    await store.view(profile?.id ?? null, params.resourceId ?? '');
    return new Response('OK', { status: 200 });
  }

  if (!profile) {
    return new Response('Unauthorized', { status: 401 });
  }

  switch (type) {
    case 'bookmark':
      await store.bookmark(profile.id, params.resourceId ?? '');
      return redirect(request.headers.get('referrer') ?? request.url);
    case 'unbookmark':
      await store.unbookmark(profile.id, params.resourceId ?? '');
      return redirect(request.headers.get('referrer') ?? request.url);
  }
};

export let loader: LoaderFunction = async ({ context, params }) => {
  const { session, store } = context as Context;
  const [resource, profile] = await Promise.all([
    store.query(params.resourceId ?? ''),
    session.isAuthenticated(),
  ]);

  if (!resource) {
    throw notFound();
  }

  const searchOptions: SearchOptions = {
    sortBy: 'hotness',
    excludes: [resource.id],
    limit: 6,
  };
  const [
    [message, setCookieHeader],
    user,
    builtWithPackage,
    madeByAuthor,
    alsoOnHostname,
  ] = await Promise.all([
    session.getFlashMessage(),
    profile?.id ? store.getUser(profile.id) : null,
    resource.category === 'packages'
      ? store.search(profile?.id ?? null, {
          ...searchOptions,
          integrations: [resource.title],
        })
      : null,
    typeof resource.author !== 'undefined' && resource.author !== null
      ? store.search(profile?.id ?? null, {
          ...searchOptions,
          author: resource.author,
        })
      : null,
    ['concepts', 'tutorials', 'others'].includes(resource.category)
      ? store.search(profile?.id ?? null, {
          ...searchOptions,
          hostname: new URL(resource.url).hostname,
        })
      : null,
  ]);

  return json(
    {
      resource,
      authenticated: profile !== null,
      bookmarked: user?.bookmarked.includes(resource.id) ?? false,
      message,
      builtWithPackage,
      madeByAuthor,
      alsoOnHostname,
    },
    {
      headers: setCookieHeader,
    }
  );
};

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  return (
    typeof submission === 'undefined' ||
    submission.formData.get('type') !== 'view'
  );
};

export default function EntryDetail() {
  const { submit } = useFetcher();
  const {
    resource,
    authenticated,
    bookmarked,
    message,
    builtWithPackage,
    madeByAuthor,
    alsoOnHostname,
  } = useLoaderData<{
    resource: Resource;
    authenticated: boolean;
    bookmarked: boolean;
    builtWithPackage: ResourceMetadata[] | null;
    madeByAuthor: ResourceMetadata[] | null;
    alsoOnHostname: ResourceMetadata[] | null;
  }>();

  useEffect(() => {
    submit({ type: 'view' }, { method: 'post' });
  }, [submit, resource.id]);

  const { hostname } = new URL(resource.url);

  return (
    <Panel
      title={resource.title}
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
                : authenticated
                ? 'hover:rounded-full hover:bg-gray-200 hover:text-black'
                : ''
            }`}
            disabled={!authenticated}
          >
            <SvgIcon className="w-3 h-3" href={bookmarkIcon} />
          </button>
          <label className="px-2 w-10 text-right">
            {resource.bookmarkCounts ?? 0}
          </label>
        </Form>
      }
    >
      <div className="max-w-screen-xl divide-y">
        <div className="px-3 pt-3 pb-8">
          <div className="flex flex-col lg:flex-row justify-between gap-8 2xl:gap-12">
            <div className="pt-0.5 flex-1">
              <div className="text-xs pb-1.5 text-gray-500">
                {resource.createdAt.substr(0, 10)}
              </div>
              <div>
                <a
                  className="sticky top-0"
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h2 className="inline-block text-xl break-words">
                    {resource.title}
                  </h2>
                </a>
              </div>
              <a
                className="hover:underline text-gray-400"
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SvgIcon
                  className="inline-block w-3 h-3 mr-2"
                  href={linkIcon}
                />
                {hostname}
              </a>
              {!resource.description ? null : (
                <p className="pt-6 text-gray-500 text-sm">
                  {resource.description}
                </p>
              )}
            </div>
            <div className="lg:max-w-xs w-auto">
              {resource.video ? (
                <div className="pt-1 w-full lg:w-72">
                  <div className="aspect-w-16 aspect-h-9">
                    <iframe
                      width="720"
                      height="405"
                      src={resource.video}
                      title={resource.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <a
                  className="relative"
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    className="max-h-96 rounded-lg bg-white"
                    src={resource.image ?? getScreenshotURL(resource.url)}
                    width="auto"
                    height="auto"
                    alt="cover"
                  />
                </a>
              )}
            </div>
          </div>
        </div>
        {builtWithPackage ? (
          <div className="py-8">
            <h3 className="px-3 pb-4">Built with {resource.title}</h3>
            <RelatedResources
              entries={builtWithPackage}
              search={new URLSearchParams([
                ['integration', resource.title],
              ]).toString()}
            />
          </div>
        ) : null}
        {madeByAuthor ? (
          <div className="py-8">
            <h3 className="px-3 pb-4">Made by {resource.author}</h3>
            <RelatedResources
              entries={madeByAuthor}
              search={new URLSearchParams([
                ['author', resource.author],
              ]).toString()}
            />
          </div>
        ) : null}
        {alsoOnHostname ? (
          <div className="py-8">
            <h3 className="px-3 pb-4">Also on {hostname}</h3>
            <RelatedResources
              entries={alsoOnHostname}
              search={new URLSearchParams([['hostname', hostname]]).toString()}
            />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

interface RelatedResourcesProps {
  entries: ResourceMetadata[];
  search: string;
}

function RelatedResources({
  entries,
  search,
}: RelatedResourcesProps): ReactElement {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No resources found at the moment
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2">
      {entries.map((entry) => (
        <Card key={entry.id} entry={entry} search={search} />
      ))}
    </div>
  );
}
