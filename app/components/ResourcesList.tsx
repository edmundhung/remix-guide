import { Link, useLocation } from 'remix';
import Card from '~/components/Card';
import SvgIcon from '~/components/SvgIcon';
import searchIcon from '~/icons/search.svg';
import pencilIcon from '~/icons/pencil.svg';
import timesIcon from '~/icons/times.svg';
import newIcon from '~/icons/satellite-dish.svg';
import hotIcon from '~/icons/fire-alt.svg';
import topIcon from '~/icons/badge-check.svg';
import menuIcon from '~/icons/menu.svg';
import type { ResourceMetadata } from '~/types';
import { PaneContainer, PaneHeader, PaneContent, PaneFooter } from '~/layout';
import {
	getResourceURL,
	getTitleBySearchOptions,
	toggleSearchParams,
} from '~/search';
import type { SearchOptions } from '~/types';
import { useMemo } from 'react';
import clsx from 'clsx';
import IconLink from '~/components/IconLink';

interface ResourcesListProps {
	entries: ResourceMetadata[];
	selectedResourceId: string | null | undefined;
	searchOptions: SearchOptions;
}

function isSearching(searchOptions: SearchOptions): boolean {
	const keys = ['guide', 'list', 'sort'].concat(
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
	const [toggleSearchURL, toggleMenuURL] = useMemo(
		() => [
			`?${toggleSearchParams(location.search, 'search')}`,
			`?${toggleSearchParams(location.search, 'menu')}`,
		],
		[location.search],
	);

	return (
		<PaneContainer>
			{!isSearching(searchOptions) ? (
				<PaneHeader>
					<IconLink icon={menuIcon} to={toggleMenuURL} mobileOnly />
					<div className="flex-1 line-clamp-1 text-center lg:text-left">
						{getTitleBySearchOptions(searchOptions)}
					</div>
					<IconLink icon={searchIcon} to={toggleSearchURL} />
				</PaneHeader>
			) : (
				<PaneHeader>
					<div className="flex-1 flex flex-row lg:flex-row-reverse items-center justify-center gap-4">
						<IconLink icon={pencilIcon} to={toggleSearchURL} />
						<div className="flex-1 line-clamp-1 text-center lg:text-left">
							{getTitleBySearchOptions(searchOptions)}
						</div>
					</div>
					<IconLink
						icon={timesIcon}
						to={selectedResourceId ? `?resourceId=${selectedResourceId}` : '?'}
					/>
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
				<div className="flex-1 h-full flex flex-row text-xs">
					<Link
						className={clsx(
							'flex flex-col justify-center items-center gap-1 flex-auto border-t capitalize',
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
							'flex flex-col justify-center items-center gap-1 flex-auto border-t capitalize',
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
							'flex flex-col justify-center items-center gap-1 flex-auto border-t capitalize',
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
