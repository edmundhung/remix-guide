import type { MetaFunction } from 'remix';
import { formatMeta } from '~/helpers';

export let meta: MetaFunction = () => {
  return formatMeta({
    title: 'Remix Guide',
    description: 'An interactive list of awesome stuffs about Remix',
    viewport: 'width=device-width, initial-scale=1',
    'og:url': 'https://remix.guide',
  });
};

export default function Index() {
  return (
    <div className="hidden h-full w-full md:flex flex-col items-center justify-center">
      <h1 className="text-xl">Remix Guide</h1>
      <div className="pt-2 text-xs">
        Share with the community, by the community
      </div>
    </div>
  );
}
