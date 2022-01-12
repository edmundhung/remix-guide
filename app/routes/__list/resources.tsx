import type { MetaFunction } from 'remix';
import About from '~/components/About';
import { capitalize, formatMeta } from '~/helpers';
import { getSearchOptions } from '~/search';

export let meta: MetaFunction = ({ location }) => {
  const searchParams = getSearchOptions(
    `${location.pathname}${location.search}`
  );

  return formatMeta({
    title: `${capitalize(searchParams.category) ?? 'Discover'}`,
    description: 'A platform for sharing everything about Remix',
    'og:url': searchParams.category
      ? `https://remix.guide/resources?category=${searchParams.category}`
      : 'https://remix.guide/resources',
  });
};

export default About;
