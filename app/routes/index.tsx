import type { LoaderFunction } from 'remix';
import { useLoaderData } from 'remix';
import Card from '~/components/Card';

export let loader: LoaderFunction = async ({ context }) => {
  const entries = context.search();

  return { entries };
};

export default function Index() {
  let { entries } = useLoaderData();

  return (
    <div className="grid grid-cols-masonry pl-px pt-px">
      {entries.map((entry) => (
        <Card
          key={entry.id}
          className="-ml-px -mt-px"
          id={entry.id}
          url={entry.url}
          type={entry.type}
          title={entry.title}
          description={entry.description}
          image={entry.image}
          tags={entry.tags}
        />
      ))}
    </div>
  );
}
