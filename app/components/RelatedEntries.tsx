import { Link } from 'remix';
import Card from '~/components/Card';
import type { Entry } from '~/types';
import { capitalize } from '~/helpers';
import * as meta from '~/meta';

interface RelatedEntriesProps {
  title: string;
  categories: string[];
  entries: Entry[];
}

function RelatedEntries({ title, categories, entries }: RelatedEntriesProps) {
  return (
    <section>
      <div className="px-2 py-4 border-b mb-8 flex flex-col md:flex-row justify-between">
        <span className="pt-4 text-gray-500">{title}</span>
        {categories.length > 1 ? (
          <nav className="pt-4 -mx-2">
            {meta.categories
              .filter((c) => categories.includes(c))
              .map((category) => (
                <Link
                  key={category}
                  className="px-2 transition-colors text-gray-300 hover:text-gray-600"
                  to={category}
                  prefetch="intent"
                >
                  {capitalize(category)}
                </Link>
              ))}
          </nav>
        ) : null}
      </div>
      <div className="grid grid-cols-masonry pl-px pt-px">
        {entries.map((entry) => (
          <Card
            key={entry.slug}
            className="hover:border-black focus:border-black z-0 hover:z-10 focus:z-10 sm:aspect-w-1 sm:aspect-h-1 -ml-px -mt-px"
            slug={entry.slug}
            category={entry.category}
            title={entry.title}
            description={entry.description}
          />
        ))}
      </div>
    </section>
  );
}

export default RelatedEntries;
