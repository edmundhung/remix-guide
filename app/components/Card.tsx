import { Link } from 'remix';
import type { ReactElement } from 'react';
import type { ResourceMetadata } from '~/types';
import { getSite } from '~/search';

interface CardProps {
  entry: ResourceMetadata;
  search: string;
  selected?: boolean;
}

function Card({ entry, search, selected }: CardProps): ReactElement {
  return (
    <article className="py-1">
      <Link
        className={`block rounded-lg no-underline ${
          selected
            ? 'shadow-inner bg-gray-800'
            : 'hover:shadow-inner hover:bg-gray-900'
        }`}
        title={entry.title}
        to={
          search ? `/resources/${entry.id}?${search}` : `/resources/${entry.id}`
        }
        prefetch="intent"
      >
        <section className="px-2.5 py-2.5 text-sm">
          <div className="text-xs pb-1.5 text-gray-500 flex flex-row gap-4">
            <span className="flex-1 truncate">
              <span className="capitalize">{entry.category}</span> /{' '}
              {getSite(entry.url)}
            </span>
            <span>{entry.createdAt.substr(0, 10)}</span>
          </div>
          <h2 className="break-words line-clamp-2">{entry.title}</h2>
          {!entry.description ? null : (
            <p className="text-gray-400 line-clamp-1 break-all">
              {entry.description}
            </p>
          )}
        </section>
      </Link>
    </article>
  );
}

export default Card;
