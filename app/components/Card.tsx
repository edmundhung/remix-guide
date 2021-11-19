import { ReactElement, useEffect, useReducer } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Link } from 'remix';
import Hyperlink from '~/components/Hyperlink';

interface CardProps {
  className?: string;
  id: string;
  url: string;
  type: string;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
}

function Card({
  className,
  id,
  url,
  type,
  title,
  description,
  image,
  tags,
}: CardProps): ReactElement {
  return (
    <article
      className={`flex flex-col overflow-hidden bg-white text-primary border hover:border-black focus:border-black z-0 hover:z-10 focus:z-10 aspect-w-1 aspect-h-1 ${className}`.trim()}
      style={{ aspectRatio: '1' }}
      tabIndex="0"
    >
      <Hyperlink className="no-underline flex-grow" to={`/${type}/${id}`}>
        {true || !image ? null : (
          <figure>
            <img src={image} width="100%" alt="cover" />
          </figure>
        )}
        <section className="p-8 flex flex-col h-full">
          {!type ? null : (
            <div className="capitalize text-secondary text-xs font-light mb-5">
              {type}
            </div>
          )}
          <h2 className="text-xl flex-grow break-words">{title}</h2>
          {!description ? null : (
            <p className="text-xs pt-10 line-clamp-2">{description}</p>
          )}
        </section>
      </Hyperlink>
      {!tags ? null : (
        <footer className="p-8 text-sm">
          <div className="whitespace-nowrap overflow-hidden overflow-ellipsis divide-x -mx-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                className="px-2 hover:underline"
                to={`?tag=${encodeURIComponent(tag)}`}
                prefetch="intent"
              >
                {tag}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}

export default Card;
