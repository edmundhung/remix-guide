import { ReactElement } from 'react';
import { Link } from 'remix';

interface CardProps {
  className?: string;
  slug: string;
  category: string;
  author?: string;
  title: string;
  description?: string;
  views?: number;
}

function Card({
  className,
  slug,
  author,
  category,
  title,
  description,
  views,
}: CardProps): ReactElement {
  return (
    <article
      className={`flex flex-col border dark:border-gray-600 lg:text-gray-500 hover:text-black dark:hover:text-gray-200 duration-150 ${className}`.trim()}
    >
      <Link
        className="no-underline flex-grow"
        to={`/${category}/${slug}`}
        prefetch="intent"
      >
        <section className="relative p-8 flex flex-col h-full text-xs">
          <div className="flex flex-row justify-between font-light mb-5">
            <div>
              <span className="capitalize">{category}</span>
              {!author ? null : <span> / by {author}</span>}
            </div>
            {views > 0 ? <div>({views})</div> : null}
          </div>
          <h2 className="flex-grow text-xl break-words text-black dark:text-gray-200">
            {title}
          </h2>
          {!description ? null : (
            <p className="pt-10 line-clamp-2">{description}</p>
          )}
        </section>
      </Link>
    </article>
  );
}

export default Card;
