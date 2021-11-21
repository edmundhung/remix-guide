import { ReactElement } from 'react';
import { Link } from 'remix';

interface CardProps {
  className?: string;
  slug: string;
  category: string;
  author?: string;
  title: string;
  description?: string;
}

function Card({
  className,
  slug,
  author,
  category,
  title,
  description,
}: CardProps): ReactElement {
  return (
    <article
      className={`flex flex-col border lg:text-gray-500 hover:text-black duration-150 ${className}`.trim()}
    >
      <Link
        className="no-underline flex-grow"
        to={`/${category}/${slug}`}
        prefetch="intent"
      >
        <section className="relative p-8 flex flex-col h-full text-xs">
          <div className="font-light mb-5">
            <span className="capitalize">{category}</span>
            {!author ? null : <span> / {author}</span>}
          </div>
          <h2 className="flex-grow text-xl break-words text-black">{title}</h2>
          {!description ? null : (
            <p className="pt-10 line-clamp-2">{description}</p>
          )}
        </section>
      </Link>
    </article>
  );
}

export default Card;
