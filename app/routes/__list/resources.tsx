import type { MetaFunction } from 'remix';
import { useMatches } from 'remix';
import Banner from '~/components/Banner';
import { capitalize, formatMeta } from '~/helpers';

export let meta: MetaFunction = ({ location }) => {
  const searchParams = new URLSearchParams(location.search);
  const list = searchParams.get('list');

  return formatMeta({
    title: `${capitalize(list) ?? 'Latest Resources'}`,
    description: 'A platform for sharing everything about Remix',
    'og:url': list
      ? `https://remix.guide/resources?list=${list}`
      : 'https://remix.guide/resources',
  });
};

export default function Resources() {
  const matches = useMatches();
  const { version } = matches[0]?.data ?? {};

  return <Banner version={version} />;
}
