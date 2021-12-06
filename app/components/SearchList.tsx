import { ReactElement } from 'react';
import { Link } from 'remix';
import Panel from '~/components/Panel';
import type { Entry } from '~/types';
import { useResourcesSearchParams } from '~/search';

interface SearchListProps {
  entries: Entry[];
  currentId: string | null;
}

function SearchList({ entries, currentId }: SearchListProps): ReactElement {
  const searchParams = useResourcesSearchParams();

  return (
    <Panel
      title={`Showing ${entries.length} ${
        entries.length > 1 ? 'entries' : 'entry'
      }`}
      type="list"
    >
      {entries.length === 0 ? (
        <div className="text-center pt-8 text-gray-500">
          No entry found at the moment
        </div>
      ) : (
        <div className="">
          {entries.map((entry) => (
            <article key={entry.slug} className="py-1">
              <Link
                className={`block rounded-lg no-underline ${
                  currentId === entry.id
                    ? 'shadow-inner bg-gray-800'
                    : 'hover:shadow-inner hover:bg-gray-900'
                }`}
                to={`/resources/${entry.id}?${searchParams.toString()}`}
                prefetch="intent"
              >
                <section className="px-3 py-2.5 text-sm">
                  <div className="text-xs pb-1.5 text-gray-500 flex flex-row justify-between">
                    <span>
                      {`${entry.date ?? new Date().toISOString()}`.substr(
                        0,
                        10
                      )}
                    </span>
                    <span>{entry.author}</span>
                  </div>
                  <h2 className="break-words line-clamp-2">{entry.title}</h2>
                  {!entry.description ? null : (
                    <p className="pt-1 text-gray-400 line-clamp-2">
                      {entry.description}
                    </p>
                  )}
                </section>
              </Link>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default SearchList;
