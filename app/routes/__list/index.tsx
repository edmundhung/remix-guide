import type { MetaFunction } from 'remix';
import { useMatches } from 'remix';
import Banner from '~/components/Banner';
import { formatMeta } from '~/helpers';

export let meta: MetaFunction = () => {
  return formatMeta({
    title: 'Remix Guide',
    description: 'A platform for sharing everything about Remix',
    'og:url': 'https://remix.guide',
  });
};

export default function Index() {
  const matches = useMatches();
  const { version } = matches[0]?.data ?? {};

  return <Banner version={version} />;
}
