import { ReactElement } from 'react';
import { Link, useLocation } from 'remix';
import List from '~/components/List';
import type { Entry } from '~/types';

interface SearchListProps {
  entries: Entry[];
  currentId: string | null;
}

function SearchList({ entries, currentId }: SearchListProps): ReactElement {
  const location = useLocation();

  return (
    <div className="w-96">
      <List
        title={`Showing ${entries.length} ${
          entries.length > 1 ? 'entries' : 'entry'
        }`}
      >
        {entries.length === 0 ? (
          <div className="text-center pt-8 text-gray-500">
            No entry found at the moment
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => (
              <article
                key={entry.slug}
                className={`rounded-lg ${
                  currentId === `${entry.category}-${entry.slug}`
                    ? 'shadow-inner bg-gray-700'
                    : 'hover:shadow-inner hover:bg-gray-800'
                }`}
              >
                <Link
                  className="no-underline"
                  to={`/resources/${entry.category}-${entry.slug}${location.search}`}
                  prefetch="intent"
                >
                  <section className="px-3 py-2.5 text-sm font-light">
                    <h2 className="font-normal break-words line-clamp-2">
                      {entry.title}
                    </h2>
                    {!entry.description ? null : (
                      <p className="pt-0.5 text-gray-500 line-clamp-2">
                        {entry.description}
                      </p>
                    )}
                    <div className="pt-0.5 text-gray-500">
                      {!entry.author ? null : (
                        <span>
                          by{' '}
                          <span className="text-gray-400">{entry.author}</span>
                        </span>
                      )}
                    </div>
                  </section>
                </Link>
              </article>
            ))}
          </div>
        )}
      </List>
    </div>
  );
}

export default SearchList;
