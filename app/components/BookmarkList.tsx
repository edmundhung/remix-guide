import { Link, useLocation } from 'remix';
import Card from '~/components/Card';
import SvgIcon from '~/components/SvgIcon';
import searchIcon from '~/icons/search.svg';
import pencilIcon from '~/icons/pencil.svg';
import timesIcon from '~/icons/times.svg';
import type { Bookmark } from '~/types';
import MenuLink from '~/components/MenuLink';
import { PaneContainer, PaneHeader, PaneContent } from '~/layout';
import {
	getRelatedSearchParams,
	getTitleBySearchOptions,
	toggleSearchList,
} from '~/search';
import type { SearchOptions } from '~/types';
import { useMemo } from 'react';

interface BookmarkListProps {
	entries: Bookmark[];
	selectedId: string | null | undefined;
	searchOptions: SearchOptions;
}

function isSearching(searchOptions: SearchOptions): boolean {
	return Object.entries(searchOptions).some(
		([key, value]) =>
			!['guide', 'list'].includes(key) &&
			(Array.isArray(value) ? value.length > 0 : value !== null),
	);
}

export default function BookmarkList({
	entries,
	selectedId,
	searchOptions,
}: BookmarkListProps) {
	const location = useLocation();
	const toggleSearchURL = useMemo(() => {
		const searchParams = getRelatedSearchParams(location.search, [
			'bookmarkId',
		]);
		const search = toggleSearchList(searchParams);

		return `?${search}`;
	}, [location.search]);

	return (
		<PaneContainer>
			{!isSearching(searchOptions) ? (
				<PaneHeader>
					<MenuLink />
					<div className="flex-1 line-clamp-1 text-center lg:text-left">
						{getTitleBySearchOptions(searchOptions)}
					</div>
					<Link
						className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
						to={toggleSearchURL}
					>
						<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={searchIcon} />
					</Link>
				</PaneHeader>
			) : (
				<PaneHeader>
					<div className="flex-1 flex flex-row lg:flex-row-reverse items-center justify-center gap-4">
						<Link
							className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
							to={toggleSearchURL}
						>
							<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={pencilIcon} />
						</Link>
						<div className="flex-1 line-clamp-1 text-center lg:text-left">
							{getTitleBySearchOptions(searchOptions)}
						</div>
					</div>
					<Link
						className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
						to={selectedId ? `?bookmarkId=${selectedId}` : '?'}
					>
						<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={timesIcon} />
					</Link>
				</PaneHeader>
			)}
			<PaneContent>
				{entries.length === 0 ? (
					<div className="text-center py-16 text-gray-500">
						No bookmarks found at the moment
					</div>
				) : (
					<div>
						{entries.map((entry) => (
							<Card
								key={entry.id}
								entry={entry}
								searchOptions={searchOptions}
								selected={entry.id === selectedId}
							/>
						))}
					</div>
				)}
			</PaneContent>
		</PaneContainer>
	);
}
