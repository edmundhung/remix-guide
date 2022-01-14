import type { ReactElement } from 'react';
import Card from '~/components/Card';
import { getTitleBySearchOptions } from '~/search';
import type { ResourceMetadata, SearchOptions } from '~/types';

interface SuggestedResourcesProps {
  entries: ResourceMetadata[];
  searchOptions: SearchOptions;
}

function SuggestedResources({
  entries,
  searchOptions,
}: SuggestedResourcesProps): ReactElement {
  return (
    <div className="py-8">
      <h3 className="px-2.5 pb-4">{getTitleBySearchOptions(searchOptions)}</h3>
      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No resources found at the moment
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-2">
          {entries.map((entry) => (
            <Card key={entry.id} entry={entry} searchOptions={searchOptions} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SuggestedResources;
