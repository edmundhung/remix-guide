import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useLocation } from '@remix-run/react';
import clsx from 'clsx';
import SearchList from '~/components/SearchList';
import ResourcesList from '~/components/ResourcesList';
import { getSearchOptions } from '~/search';
import type { Resource } from '~/types';

interface ListProps {
	entries: Resource[];
	count: number;
	selectedId?: string | null;
	children: ReactNode;
}

function Feed({ entries, count, selectedId, children }: ListProps) {
	const location = useLocation();
	const searchParams = useMemo(
		() => new URLSearchParams(location.search),
		[location.search],
	);
	const searchOptions = getSearchOptions(
		`${location.pathname}${location.search}`,
	);
	const isSearching = searchParams.get('open') === 'search';
	const selected = typeof selectedId !== 'undefined' && selectedId !== null;

	return (
		<div className="flex flex-row">
			<div
				className={clsx('lg:border-r w-full lg:w-96', {
					'hidden lg:block': selected,
				})}
			>
				{isSearching ? (
					<SearchList
						searchOptions={searchOptions}
						selectedResourceId={selectedId}
					/>
				) : (
					<ResourcesList
						entries={entries}
						count={count}
						searchOptions={searchOptions}
						selectedResourceId={selectedId}
					/>
				)}
			</div>
			<div className={clsx('flex-1', { 'hidden lg:block': !selected })}>
				{children}
			</div>
		</div>
	);
}

export default Feed;
