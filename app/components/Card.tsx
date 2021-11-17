import { ReactElement } from 'react';
import { Link } from 'remix';
import Hyperlink from '~/components/Hyperlink';

interface CardProps {
  className?: string;
  url: string;
  type: string;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
}

function Card({
  className,
  url,
  type,
  title,
  description,
  image,
  tags,
}: CardProps): ReactElement {
  return (
    <article
      className={`flex flex-col overflow-hidden bg-white text-primary border hover:border-black z-0 hover:z-10 ${className}`.trim()}
    >
      <Hyperlink className="no-underline flex-grow" to={url}>
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
