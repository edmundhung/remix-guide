import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useLocation } from 'remix';
import clsx from 'clsx';
import SearchList from '~/components/SearchList';
import BookmarkList from '~/components/BookmarkList';
import { getSearchOptions } from '~/search';
import type { Bookmark } from '~/types';

interface ListProps {
	entries: Bookmark[];
	selectedId: string | null | undefined;
	children: ReactNode;
}

function Feed({ entries, selectedId, children }: ListProps) {
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
		<div className="h-full flex flex-row">
			<div
				className={clsx('lg:border-r w-full lg:w-96', {
					'hidden lg:block': selected,
				})}
			>
				{isSearching ? (
					<SearchList searchOptions={searchOptions} selectedId={selectedId} />
				) : (
					<BookmarkList
						entries={entries}
						searchOptions={searchOptions}
						selectedId={selectedId}
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
