import { Link } from '@remix-run/react';
import { useInView } from 'react-intersection-observer';
import { getResourceSearchParams } from '~/search';
import { SearchOptions } from '~/types';
import { useEffect, useMemo, useRef } from 'react';

interface ShowMoreButtonProps {
	searchOptions: SearchOptions;
	selected: string | null | undefined;
}

function ShowMoreButton({ searchOptions, selected }: ShowMoreButtonProps) {
	const { ref, inView } = useInView();
	const link = useRef<HTMLAnchorElement>(null);
	const url = useMemo(() => {
		const searchParams = getResourceSearchParams({
			...searchOptions,
			limit: (searchOptions.limit ?? 0) + 25,
		});

		if (selected) {
			searchParams.set('resourceId', selected);
		}

		return `?${searchParams.toString()}`;
	}, [searchOptions, selected]);

	useEffect(() => {
		if (!inView || !link.current) {
			return;
		}

		link.current.click();
	}, [inView]);

	return (
		<div ref={ref} className="py-1">
			<Link
				ref={link}
				className="block rounded-lg no-underline text-sm text-center py-2 hover:bg-gray-800"
				to={url}
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
