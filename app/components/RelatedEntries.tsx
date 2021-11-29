import Card from '~/components/Card';
import type { Entry } from '~/types';
import { capitalize } from '~/helpers';
import * as meta from '~/meta';
import { useState } from 'react';

interface RelatedEntriesProps {
  title: string;
  categories?: string[];
  entries: Entry[];
}

function RelatedEntries({ title, categories, entries }: RelatedEntriesProps) {
  const [selected, setSelected] = useState(null);
  const availableCategories = categories ?? [
    ...new Set(entries.map((entry) => entry.category)),
  ];
  const options = meta.categories.filter((c) =>
    availableCategories.includes(c)
  );
  const selectedEntries = entries.filter(
    (entry) => selected === null || entry.category === selected
  );

  return (
    <section>
      <div className="sticky top-0 leading-8 bg-white dark:bg-black z-20 px-8 py-4 mb-8 border-b dark:border-b-gray-600 text-sm text-gray-500 flex flex-col md:flex-row justify-between">
        <span className="text-gray-500">{title}</span>
        {options.length > 1 ? (
          <nav className="-mx-2">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                className={`px-2 transition-colors ${
                  selected === option
                    ? 'text-gray-900 dark:text-gray-200'
                    : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                }`}
                to={option}
                onClick={() =>
                  setSelected((selected) =>
                    selected !== option ? option : null
                  )
                }
              >
                {capitalize(option)}
              </button>
            ))}
          </nav>
        ) : null}
      </div>
      {selectedEntries.length > 0 ? (
        <div className="grid grid-cols-masonry pl-px pt-px">
          {selectedEntries.map((entry) => (
            <Card
              key={entry.slug}
              className="hover:border-black dark:hover:border-gray-200 dark:hover:text-gray-400 z-0 hover:z-10 focus:z-10 sm:aspect-w-1 sm:aspect-h-1 -ml-px -mt-px"
              slug={entry.slug}
              author={entry.author}
              category={entry.category}
              title={entry.title}
              description={entry.description}
              views={entry.views}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 flex justify-center text-gray-500">
          No entries found
        </div>
      )}
    </section>
  );
}

export default RelatedEntries;
