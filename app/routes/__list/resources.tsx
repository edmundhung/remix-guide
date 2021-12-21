import type { MetaFunction } from 'remix';
import Banner from '~/components/Banner';
import { capitalize, formatMeta } from '~/helpers';

export let meta: MetaFunction = ({ location }) => {
  const searchParams = new URLSearchParams(location.search);
  const list = searchParams.get('list');

  return formatMeta({
    title: `${capitalize(list) ?? 'Latest Resources'}`,
    description: 'An interactive list of awesome stuffs about Remix',
    'og:url': list
      ? `https://remix.guide/resources?list=${list}`
      : 'https://remix.guide/resources',
  });
};

export default function Resources() {
  return <Banner />;
}
