import {
  LoaderFunction,
  ActionFunction,
  ShouldReloadFunction,
  MetaFunction,
} from 'remix';
import {
  Form,
  Link,
  json,
  redirect,
  useLoaderData,
  useTransition,
  useFetcher,
} from 'remix';
import { ReactElement, useEffect } from 'react';
import { capitalize, formatMeta, notFound } from '~/helpers';
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
import { getSite, createIntegrationSearch } from '~/search';

function getScreenshotURL(url: string): string {
  return `https://cdn.statically.io/screenshot/${url.replace(
    `${new URL(url).protocol}//`,
    ''
  )}`;
}

export let meta: MetaFunction = ({ data }) => {
  return formatMeta({
    title: `${capitalize(data?.resource.category)} - ${data?.resource.title}`,
    description: data?.resource.description,
    'og:url': `https://remix.guide/resources/${data?.resource.id}`,
  });
};

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
    alsoOnSite,
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
          site: getSite(resource.url),
        })
      : null,
  ]);

  const isUserBookmarked = user?.bookmarked.includes(resource.id) ?? false;
  const isResourceBookmarked = user
    ? resource.bookmarked.includes(user.profile.id)
    : false;

  return json(
    {
      authenticated: profile !== null,
      bookmarked: isUserBookmarked,
      resource:
        isUserBookmarked === isResourceBookmarked
          ? resource
          : {
              ...resource,
              bookmarked: isUserBookmarked
                ? resource.bookmarked.concat(user?.profile.id)
                : resource.bookmarked.filter((id) => id !== user?.profile.id),
            },
      message,
      builtWithPackage,
      madeByAuthor,
      alsoOnSite,
    },
    {
      headers: setCookieHeader,
    }
  );
};

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  return ['bookmark', 'unbookmark'].includes(submission?.formData.get('type'));
};

export default function EntryDetail() {
  const transition = useTransition();
  const { submit } = useFetcher();
  const {
    resource,
    authenticated,
    bookmarked,
    message,
    builtWithPackage,
    madeByAuthor,
    alsoOnSite,
  } = useLoaderData<{
    resource: Resource;
    authenticated: boolean;
    bookmarked: boolean;
    builtWithPackage: ResourceMetadata[] | null;
    madeByAuthor: ResourceMetadata[] | null;
    alsoOnSite: ResourceMetadata[] | null;
  }>();

  useEffect(() => {
    submit({ type: 'view' }, { method: 'post' });
  }, [submit, resource.id]);

  const site = getSite(resource.url);

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
            disabled={!authenticated || transition.submission}
          >
            <SvgIcon className="w-3 h-3" href={bookmarkIcon} />
          </button>
          <label className="px-2 w-10 text-right">
            {resource.bookmarked.length}
          </label>
        </Form>
      }
    >
      <div className="max-w-screen-xl divide-y">
        <div className="px-2.5 pt-3 pb-8">
          <div className="flex flex-col-reverse lg:flex-row justify-between gap-8 2xl:gap-12">
            <div className="pt-0.5 flex-1">
              <div className="flex items-center justify-between text-xs pb-1.5 text-gray-500">
                <span className="capitalize">{resource.category}</span>
                <span>{resource.createdAt.substr(0, 10)}</span>
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
                {site}
              </a>
              {!resource.integrations?.length > 0 ? null : (
                <div className="pt-4 flex flex-wrap gap-2">
                  {resource.integrations?.map((integration) => (
                    <Link
                      key={integration}
                      className="text-xs bg-gray-700 hover:bg-gray-500 rounded-md px-2"
                      to={`/resources?${createIntegrationSearch(integration)}`}
                    >
                      {integration}
                    </Link>
                  ))}
                </div>
              )}
              {!resource.description ? null : (
                <p className="pt-6 text-gray-400 text-sm break-words whitespace-pre-line">
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
            <h3 className="px-2.5 pb-4">Built with {resource.title}</h3>
            <RelatedResources
              entries={builtWithPackage}
              search={new URLSearchParams({
                integration: resource.title,
              }).toString()}
            />
          </div>
        ) : null}
        {madeByAuthor ? (
          <div className="py-8">
            <h3 className="px-2.5 pb-4">Made by {resource.author}</h3>
            <RelatedResources
              entries={madeByAuthor}
              search={new URLSearchParams({
                author: resource.author,
              }).toString()}
            />
          </div>
        ) : null}
        {alsoOnSite ? (
          <div className="py-8">
            <h3 className="px-2.5 pb-4">Also on {site}</h3>
            <RelatedResources
              entries={alsoOnSite}
              search={new URLSearchParams({ site }).toString()}
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
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-2">
      {entries.map((entry) => (
        <Card key={entry.id} entry={entry} search={search} />
      ))}
    </div>
  );
}
