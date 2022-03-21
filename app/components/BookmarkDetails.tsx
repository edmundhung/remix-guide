import { ReactElement, useMemo } from 'react';
import { useLocation } from 'remix';
import { PaneContainer, PaneHeader, PaneContent, PaneFooter } from '~/layout';
import IconLink from '~/components/IconLink';
import InputOption from '~/components/InputOption';
import timesIcon from '~/icons/times.svg';
import type { Resource } from '~/types';
import { toggleSearchParams } from '~/search';
import { useLists } from '~/hooks';

interface BookmarkDetailsProps {
	resource: Resource;
}

function BookmarkDetails({ resource }: BookmarkDetailsProps): ReactElement {
	const location = useLocation();
	const lists = useLists();
	const closeURL = useMemo(
		() => `?${toggleSearchParams(location.search, 'bookmark')}`,
		[location.search],
	);

	return (
		<PaneContainer>
			<PaneHeader>
				<h2 className="flex-1 line-clamp-1 text-left">Bookmark</h2>
				<IconLink icon={timesIcon} to={closeURL} />
			</PaneHeader>
			<PaneContent>
				<input type="hidden" name="resourceId" value={resource.id} />
				<div className="py-3">
					<div className="px-2.5 pt-0.5 pb-0.5 text-gray-400 text-xs">
						Title
					</div>
					<div className="px-2.5 py-0.5">{resource.title}</div>
				</div>
				<div className="py-3">
					<div className="px-2.5 pt-0.5 pb-0.5 text-gray-400 text-xs">
						Description
					</div>
					<div className="py-0.5">
						<textarea
							className="w-full px-2.5 bg-gray-900 text-gray-200 rounded-lg h-24"
							name="description"
							defaultValue=""
							placeholder={resource.description ?? ''}
						/>
					</div>
				</div>
				<div className="py-3">
					<div className="px-2.5 pt-0.5 pb-0.5 text-gray-400 text-xs">List</div>
					<div className="py-0.5 capitalize">
						{lists.map((list) => (
							<InputOption
								key={list.slug}
								type="checkbox"
								name="lists"
								label={list.title}
								value={list.slug}
								checked={resource.lists?.includes(list.slug) ?? false}
							/>
						))}
					</div>
				</div>
			</PaneContent>
			<PaneFooter padding="maximum">
				<div className="flex flex-row justify-between">
					<button
						type="submit"
						name="type"
						value="update"
						className="px-2 py-1 text-center rounded-lg hover:bg-gray-800"
					>
						Update
					</button>
					<button
						type="submit"
						name="type"
						value="delete"
						className="px-2 py-1 text-center rounded-lg text-red-500 hover:bg-gray-800"
					>
						Delete
					</button>
				</div>
			</PaneFooter>
		</PaneContainer>
	);
}

export default BookmarkDetails;
