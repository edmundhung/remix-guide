import {
  LoaderFunction,
  ShouldReloadFunction,
  MetaFunction,
  useLoaderData,
} from 'remix';
import { json } from 'remix';
import About from '~/components/About';
import * as ResourcesDetails from '~/routes/__list/resources.$resourceId';
import { capitalize, formatMeta, notFound } from '~/helpers';

export let meta: MetaFunction = ({ data, params }) => {
  return formatMeta({
    title: `${capitalize(params.list)}${
      data?.resource ? ` - ${data?.resource?.title}` : ''
    }`,
    description: data?.resource?.description ?? '',
    'og:url': `https://remix.guide/${params.owner}/${params.list}`,
  });
};

export let loader: LoaderFunction = async ({ context, params, request }) => {
  if (params.list !== 'history' && params.list !== 'bookmarks') {
    throw notFound();
  }

  const url = new URL(request.url);
  const resourceId = url.searchParams.get('resourceId');

  if (!resourceId) {
    return json({});
  }

  return ResourcesDetails.loader({
    context,
    params: {
      ...params,
      resourceId,
    },
    request,
  });
};

export const unstable_shouldReload: ShouldReloadFunction = (args) => {
  const { prevUrl, url } = args;

  if (
    prevUrl.searchParams.get('resourceId') !==
    url.searchParams.get('resourceId')
  ) {
    return true;
  }

  return ResourcesDetails.unstable_shouldReload(args);
};

export default function UserProfile() {
  const data = useLoaderData();

  if (!data?.resource) {
    return <About />;
  }

  // eslint-disable-next-line react/jsx-pascal-case
  return <ResourcesDetails.default />;
}
