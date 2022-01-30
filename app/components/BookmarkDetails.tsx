import { Form, Link, useLocation, useTransition, useFetcher } from 'remix';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import type { Bookmark } from '~/types';
import SvgIcon from '~/components/SvgIcon';
import linkIcon from '~/icons/link.svg';
import backIcon from '~/icons/back.svg';
import bookmarkIcon from '~/icons/bookmark.svg';
import {
	getSite,
	createIntegrationSearch,
	getRelatedSearchParams,
} from '~/search';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import FlashMessage from '~/components/FlashMessage';
import { User } from '~/types';

interface BookmarksDetailsProps {
	bookmark: Bookmark;
	user: User | null;
	message?: string | null;
	children: ReactNode;
}

function getScreenshotURL(url: string): string {
	return `https://cdn.statically.io/screenshot/${url.replace(
		`${new URL(url).protocol}//`,
		'',
	)}`;
}

function BookmarksDetails({
	bookmark,
	user,
	message,
	children,
}: BookmarksDetailsProps): ReactElement {
	const transition = useTransition();
	const { submit } = useFetcher();
	const location = useLocation();
	const search = useMemo(
		() => getRelatedSearchParams(location.search).toString(),
		[location.search],
	);

	useEffect(() => {
		submit(
			{ bookmarkId: bookmark.id, url: bookmark.url },
			{ method: 'post', action: '/api/view' },
		);
	}, [submit, bookmark.id, bookmark.url]);

	const authenticated = user !== null;
	const bookmarked = user?.bookmarked.includes(bookmark.id) ?? false;
	const backUrl =
		search === '' ? location.pathname : `${location.pathname}?${search}`;

	return (
		<PaneContainer>
			<PaneHeader>
				<Link
					className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
					to={backUrl}
				>
					<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={backIcon} />
				</Link>
				<div className="flex-1" />
				<Form
					className="flex flex-row items-center"
					method="post"
					action="/api/bookmark"
				>
					<input
						type="hidden"
						name="referer"
						value={`${location.pathname}${location.search}`}
					/>
					<input
						type="hidden"
						name="type"
						value={bookmarked ? 'unbookmark' : 'bookmark'}
					/>
					<input type="hidden" name="bookmarkId" value={bookmark.id} />
					<input type="hidden" name="url" value={bookmark.url} />
					<button
						type="submit"
						className={`flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 ${
							bookmarked
								? 'rounded-full text-red-500 bg-gray-200'
								: authenticated
								? 'hover:rounded-full hover:bg-gray-200 hover:text-black'
								: ''
						}`}
						disabled={
							!authenticated || typeof transition.submission !== 'undefined'
						}
					>
						<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={bookmarkIcon} />
					</button>
				</Form>
			</PaneHeader>
			<PaneContent>
				<div className="max-w-screen-xl divide-y">
					<div className="px-2.5 pt-3 pb-8">
						<div className="flex flex-col-reverse md:flex-row justify-between gap-8 2xl:gap-12">
							<div className="pt-0.5 flex-1">
								<div className="flex items-center justify-between text-xs pb-1.5 text-gray-400">
									<span className="capitalize">{bookmark.category}</span>
									<span>{bookmark.timestamp.substring(0, 10)}</span>
								</div>
								<div>
									<a
										className="sticky top-0"
										href={bookmark.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<h2 className="inline-block text-xl break-words">
											{bookmark.title ?? bookmark.url}
										</h2>
									</a>
								</div>
								<a
									className="hover:underline text-gray-400"
									href={bookmark.url}
									target="_blank"
									rel="noopener noreferrer"
								>
									<SvgIcon
										className="inline-block w-3 h-3 mr-2"
										href={linkIcon}
									/>
									{getSite(bookmark.url)}
								</a>
								{!bookmark.integrations?.length ? null : (
									<div className="pt-4 flex flex-wrap gap-2">
										{bookmark.integrations?.map((integration) => (
											<Link
												key={integration}
												className="text-xs bg-gray-700 hover:bg-gray-500 rounded-md px-2"
												to={`/bookmarks?${createIntegrationSearch(
													integration,
												)}`}
											>
												{integration}
											</Link>
										))}
									</div>
								)}
								{!bookmark.description ? null : (
									<p className="pt-6 text-gray-400 break-words whitespace-pre-line">
										{bookmark.description}
									</p>
								)}
							</div>
							<div className="md:max-w-xs w-auto">
								{bookmark.video ? (
									<div className="pt-1 w-full md:w-72">
										<div className="aspect-w-16 aspect-h-9">
											<iframe
												width="720"
												height="405"
												src={bookmark.video}
												title={bookmark.title}
												frameBorder="0"
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
												allowFullScreen
											/>
										</div>
									</div>
								) : (
									<a
										className="relative"
										href={bookmark.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<img
											className="max-h-96 rounded-lg bg-white"
											src={bookmark.image ?? getScreenshotURL(bookmark.url)}
											width="auto"
											height="auto"
											alt="cover"
										/>
									</a>
								)}
							</div>
						</div>
					</div>
					{children}
				</div>
			</PaneContent>
			<PaneFooter>
				<FlashMessage message={message ?? null} />
			</PaneFooter>
		</PaneContainer>
	);
}

export default BookmarksDetails;
