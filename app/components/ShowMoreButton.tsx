import { Link } from 'remix';
import { getResourceSearchParams } from '~/search';
import { SearchOptions } from '~/types';

interface ShowMoreButtonProps {
	searchOptions: SearchOptions;
	selected: string | null | undefined;
}

function ShowMoreButton({ searchOptions, selected }: ShowMoreButtonProps) {
	const searchParams = getResourceSearchParams({
		...searchOptions,
		limit: (searchOptions.limit ?? 0) + 25,
	});

	if (selected) {
		searchParams.set('resourceId', selected);
	}

	return (
		<div className="py-1">
			<Link
				className="block rounded-lg no-underline text-sm text-center py-2 hover:bg-gray-800"
				to={`?${searchParams.toString()}`}
				state={{ skipRestore: true }}
				replace
				prefetch="intent"
			>
				Show more
			</Link>
		</div>
	);
}

export default ShowMoreButton;
