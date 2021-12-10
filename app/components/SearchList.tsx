import { ReactElement } from 'react';
import { Link } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import { useResourcesSearchParams } from '~/search';
import type { Entry } from '~/types';
import menuIcon from '~/icons/menu.svg';
import plusIcon from '~/icons/plus.svg';
interface SearchListProps {
  entries: Entry[];
  currentId: string | null;
}

function SearchList({ entries, currentId }: SearchListProps): ReactElement {
  const searchParams = useResourcesSearchParams();
  const search = searchParams.toString();

  return (
    <section className="w-full h-full max-h-screen overflow-y-auto">
      <header className="sticky top-0 backdrop-blur flex items-center gap-2 z-20 px-8 py-4 text-sm">
        <Link
          className="flex xl:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
          to={`?${search === '' ? 'menu' : `${search}&menu`}`}
          prefetch="intent"
        >
          <SvgIcon className="w-3 h-3" href={menuIcon} />
        </Link>
        <div className="flex-1 leading-8 line-clamp-1">{`Showing ${
          entries.length
        } ${entries.length > 1 ? 'entries' : 'entry'}`}</div>
        <Link
          className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
          to="/submit"
        >
          <SvgIcon className="w-3 h-3" href={plusIcon} />
        </Link>
      </header>
      {entries.length === 0 ? (
        <div className="text-center pt-8 text-gray-500">
          No entry found at the moment
        </div>
      ) : (
        <div className="px-5 py-3">
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
    </section>
  );
}

export default SearchList;
