import type { HeadersFunction } from 'remix';

export let headers: HeadersFunction = ({ parentHeaders }) => {
  return {
    'Cache-Control': parentHeaders.get('Cache-Control'),
  };
};

export default function Index() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center">
      <h1 className="text-xl">Remix Guide</h1>
      <div className="pt-2 text-xs">
        Share with the community, by the community
      </div>
    </div>
  );
}
