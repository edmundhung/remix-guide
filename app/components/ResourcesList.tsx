import { Link, useLocation } from 'remix';
import Card from '~/components/Card';
import SvgIcon from '~/components/SvgIcon';
import searchIcon from '~/icons/search.svg';
import pencilIcon from '~/icons/pencil.svg';
import timesIcon from '~/icons/times.svg';
import newIcon from '~/icons/satellite-dish.svg';
import hotIcon from '~/icons/fire-alt.svg';
import topIcon from '~/icons/badge-check.svg';
import type { ResourceMetadata } from '~/types';
import MenuLink from '~/components/MenuLink';
import { PaneContainer, PaneHeader, PaneContent, PaneFooter } from '~/layout';
import {
	getRelatedSearchParams,
	getResourceURL,
	getTitleBySearchOptions,
	toggleSearchList,
} from '~/search';
import type { SearchOptions } from '~/types';
import { useMemo } from 'react';
import clsx from 'clsx';

interface ResourcesListProps {
	entries: ResourceMetadata[];
	selectedResourceId: string | null | undefined;
	searchOptions: SearchOptions;
}

function isSearching(searchOptions: SearchOptions): boolean {
	const keys = ['list', 'owner', 'sort'].concat(
		!searchOptions.list ? ['category'] : [],
	);

	return Object.entries(searchOptions).some(
		([key, value]) =>
			!keys.includes(key) &&
			(Array.isArray(value) ? value.length > 0 : value !== null),
	);
}

export default function ResourcesList({
	entries,
	selectedResourceId,
	searchOptions,
}: ResourcesListProps) {
	const location = useLocation();
	const toggleSearchURL = useMemo(() => {
		const searchParams = getRelatedSearchParams(location.search);

		if (searchOptions.list && selectedResourceId) {
			searchParams.set('resourceId', selectedResourceId);
		}

		return `?${toggleSearchList(searchParams)}`;
	}, [location.search, searchOptions.list, selectedResourceId]);

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
						to={
							searchOptions.list
								? selectedResourceId
									? `?resourceId=${selectedResourceId}`
									: '?'
								: selectedResourceId
								? `/resources/${selectedResourceId}`
								: '/'
						}
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
								searchOptions={searchOptions}
								selected={entry.id === selectedResourceId}
							/>
						))}
					</div>
				)}
			</PaneContent>
			<PaneFooter>
				<div className="flex flex-row text-xs">
					<Link
						className={clsx(
							'flex flex-col justify-center items-center gap-1 flex-auto py-3 border-t capitalize',
							searchOptions.sort === 'new'
								? 'border-white'
								: 'hover:border-gray-600',
						)}
						to={getResourceURL(
							{ ...searchOptions, sort: 'new' },
							selectedResourceId,
						)}
					>
						<SvgIcon href={newIcon} className="w-3 h-3" /> New
					</Link>
					<Link
						className={clsx(
							'flex flex-col justify-center items-center gap-1 flex-auto py-3 border-t capitalize',
							searchOptions.sort === 'hot'
								? 'border-white'
								: 'hover:border-gray-600',
						)}
						to={getResourceURL(
							{ ...searchOptions, sort: 'hot' },
							selectedResourceId,
						)}
					>
						<SvgIcon href={hotIcon} className="w-3 h-3" /> Hot
					</Link>
					<Link
						className={clsx(
							'flex flex-col justify-center items-center gap-1 flex-auto py-3 border-t capitalize',
							searchOptions.sort === 'top'
								? 'border-white'
								: 'hover:border-gray-600',
						)}
						to={getResourceURL(
							{ ...searchOptions, sort: 'top' },
							selectedResourceId,
						)}
					>
						<SvgIcon href={topIcon} className="w-3 h-3" /> Top
					</Link>
				</div>
			</PaneFooter>
		</PaneContainer>
	);
}
