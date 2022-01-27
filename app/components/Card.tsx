import { Link } from 'remix';
import type { ReactElement } from 'react';
import type { ResourceMetadata } from '~/types';
import { getSite, getResourceURL } from '~/search';
import type { SearchOptions } from '~/types';

interface CardProps {
	entry: ResourceMetadata;
	searchOptions: SearchOptions;
	selected?: boolean;
}

function Card({ entry, searchOptions, selected }: CardProps): ReactElement {
	return (
		<article className="py-1">
			<Link
				className={`block rounded-lg no-underline ${
					selected
						? 'bg-gray-700 text-gray-300'
						: 'hover:bg-gray-800 text-gray-400'
				}`}
				title={entry.title ?? getSite(entry.url)}
				to={getResourceURL(searchOptions, entry.id)}
				prefetch="intent"
			>
				<section className="px-2.5 py-2.5 text-sm">
					<div className="text-xs pb-1.5 flex flex-row gap-4">
						<span className="flex-1 truncate">
							<span className="capitalize">{entry.category}</span> /{' '}
							{getSite(entry.url)}
						</span>
						<span>{entry.createdAt.substr(0, 10)}</span>
					</div>
					<h2 className="text-gray-100 break-words line-clamp-2">
						{entry.title}
					</h2>
					{!entry.description ? null : (
						<p className="line-clamp-1 break-all">{entry.description}</p>
					)}
				</section>
			</Link>
		</article>
	);
}

export default Card;
