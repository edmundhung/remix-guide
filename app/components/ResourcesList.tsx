import { Link } from 'remix';
import Card from '~/components/Card';
import SvgIcon from '~/components/SvgIcon';
import searchIcon from '~/icons/search.svg';
import pencilIcon from '~/icons/pencil.svg';
import timesIcon from '~/icons/times.svg';
import type { ResourceMetadata } from '~/types';
import MenuLink from '~/components/MenuLink';
import { PaneContainer, PaneHeader, PaneContent } from '~/layout';
import { toggleSearchList } from '~/search';
import { capitalize } from '~/helpers';

interface ResourcesListProps {
  entries: ResourceMetadata[];
  selectedResourceId: string | undefined;
  searchParams: URLSearchParams;
  submitEnabled: boolean;
}

export default function ResourcesList({
  entries,
  selectedResourceId,
  searchParams,
}: ResourcesListProps) {
  const list = searchParams.get('list');
  const title = capitalize(list) ?? 'Discover';
  const isFiltering = Array.from(searchParams.keys()).some(
    (key) => key !== 'open' && key !== 'list'
  );

  return (
    <PaneContainer>
      {!isFiltering ? (
        <PaneHeader>
          <MenuLink />
          <div className="flex-1 line-clamp-1 text-center lg:text-left">
            {title}
          </div>
          <Link
            className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
            to={`?${toggleSearchList(searchParams)}`}
          >
            <SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={searchIcon} />
          </Link>
        </PaneHeader>
      ) : (
        <PaneHeader>
          <div className="flex-1 flex flex-row lg:flex-row-reverse items-center justify-center gap-4">
            <Link
              className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
              to={`?${toggleSearchList(searchParams)}`}
            >
              <SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={pencilIcon} />
            </Link>
            <div className="flex-1 line-clamp-1 text-center lg:text-left">
              Search Result
            </div>
          </div>
          <Link
            className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
            to={list ? `?${new URLSearchParams({ list }).toString()}` : '/'}
          >
            <SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={timesIcon} />
          </Link>
        </PaneHeader>
      )}
      <PaneContent>
        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No resources found at the moment
          </div>
        ) : (
          <div>
            {entries.map((entry) => (
              <Card
                key={entry.id}
                entry={entry}
                search={searchParams.toString()}
                selected={entry.id === selectedResourceId}
              />
            ))}
          </div>
        )}
      </PaneContent>
    </PaneContainer>
  );
}
