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

function useHash(): string {
  const location = useLocation();
  const [, rerender] = useReducer((i) => i + 1, 0);

  useEffect(() => {
    window.addEventListener('hashchange', rerender);

    return () => {
      window.removeEventListener('hashchange', rerender);
    };
  }, []);

  return location.hash;
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
  const [searchParams] = useSearchParams();
  const hash = useHash();

  return (
    <article
      className={`flex flex-col overflow-hidden bg-white text-primary border hover:border-black z-0 hover:z-10 ${
        hash === `#${id}` ? 'col-span-2' : ''
      } ${className}`.trim()}
    >
      <Hyperlink
        className="no-underline flex-grow"
        to={`?${searchParams.toString()}#${id}`}
      >
        {!image ? null : (
          <figure>
            <img src={image} width="100%" alt="cover" />
          </figure>
        )}
        <section className="p-8">
          {!type ? null : (
            <div className="capitalize text-secondary text-xs font-light mb-5">
              {type}
            </div>
          )}
          <h2 className="my-0 text-xl">{title}</h2>
          {!description ? null : <p className="mt-10 text-sm">{description}</p>}
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
