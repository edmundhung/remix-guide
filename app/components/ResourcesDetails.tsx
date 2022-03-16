import { Link, useLocation, useFetcher } from 'remix';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import type { Resource } from '~/types';
import SvgIcon from '~/components/SvgIcon';
import linkIcon from '~/icons/link.svg';
import backIcon from '~/icons/back.svg';
import bookmarkIcon from '~/icons/bookmark.svg';
import {
	getSite,
	createIntegrationSearch,
	excludeParams,
	toggleSearchParams,
} from '~/search';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import FlashMessage from '~/components/FlashMessage';
import { User } from '~/types';
import IconLink from '~/components/IconLink';
import { isAdministrator } from '~/helpers';

interface ResourcesDetailsProps {
	resource: Resource;
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

function ResourcesDetails({
	resource,
	user,
	message,
	children,
}: ResourcesDetailsProps): ReactElement {
	const { submit } = useFetcher();
	const bookmark = useFetcher();
	const location = useLocation();
	const [backURL, bookmarkURL] = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const backURL = `?${excludeParams('resourceId', searchParams)}`;
		const bookmarkURL = `?${toggleSearchParams(
			searchParams.toString(),
			'bookmark',
		)}`;

		return [backURL, bookmarkURL];
	}, [location.search]);

	useEffect(() => {
		submit(
			{ type: 'view', resourceId: resource.id, url: resource.url },
			{ method: 'post', action: `${location.pathname}?index` },
		);
	}, [submit, resource.id, resource.url, location.pathname]);

	const authenticated = user !== null;

	let bookmarked = user?.bookmarked.includes(resource.id) ?? false;
	let bookmarkCount = resource.bookmarkUsers?.length ?? 0;

	if (bookmark.submission) {
		const pendingBookmarkType = bookmark.submission?.formData.get('type');

		if (pendingBookmarkType === 'bookmark') {
			bookmarked = true;
			bookmarkCount = bookmarkCount + 1;
		} else if (pendingBookmarkType === 'unbookmark') {
			bookmarked = false;
			bookmarkCount = bookmarkCount - 1;
		}
	}

	return (
		<PaneContainer>
			<PaneHeader>
				<IconLink icon={backIcon} to={backURL} />
				<div className="flex-1" />
				{!isAdministrator(user?.profile.name) ? (
					<bookmark.Form className="flex flex-row items-center" method="post">
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
						<input type="hidden" name="resourceId" value={resource.id} />
						<input type="hidden" name="url" value={resource.url} />
						<button
							type="submit"
							className={`flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 ${
								bookmarked
									? 'rounded-full text-red-500 bg-gray-200'
									: authenticated
									? 'hover:rounded-full hover:bg-gray-200 hover:text-black'
									: ''
							}`}
							disabled={!authenticated || bookmark.state === 'submitting'}
						>
							<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={bookmarkIcon} />
						</button>
						<label className="px-2 w-10 text-right">
							{bookmarkCount >= 0 ? bookmarkCount : 0}
						</label>
					</bookmark.Form>
				) : (
					<div className="flex flex-row items-center">
						<Link
							className="flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 rounded-full text-red-500 bg-gray-200 hover:rounded-full hover:bg-gray-200 hover:text-black"
							to={bookmarkURL}
							state={{ skipRestore: true }}
						>
							<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={bookmarkIcon} />
						</Link>
						<label className="px-2 w-10 text-right">
							{bookmarkCount >= 0 ? bookmarkCount : 0}
						</label>
					</div>
				)}
			</PaneHeader>
			<PaneContent>
				<div className="flex flex-row justify-center">
					<div className="flex-1 4xl:max-w-screen-lg divide-y">
						<div className="px-2.5 pt-3 pb-8">
							<div className="flex flex-col-reverse 2xl:flex-row justify-between gap-8 2xl:gap-12">
								<div className="pt-0.5 flex-1">
									<div className="flex items-center justify-between text-xs pb-1.5 text-gray-400">
										<span className="capitalize">{resource.category}</span>
										<span>{resource.createdAt.substring(0, 10)}</span>
									</div>
									<div>
										<a
											className="sticky top-0"
											href={resource.url}
											target="_blank"
											rel="noopener noreferrer"
										>
											<h2 className="inline-block text-xl break-words">
												{resource.title ?? resource.url}
											</h2>
										</a>
									</div>
									<a
										className="hover:underline text-gray-400"
										href={resource.url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<SvgIcon
											className="inline-block w-3 h-3 mr-2"
											href={linkIcon}
										/>
										{getSite(resource.url)}
									</a>
									{!resource.integrations?.length ? null : (
										<div className="pt-4 flex flex-wrap gap-2">
											{resource.integrations?.map((integration) => (
												<Link
													key={integration}
													className="text-xs bg-gray-700 hover:bg-gray-500 rounded-md px-2"
													to={`/news?${createIntegrationSearch(integration)}`}
												>
													{integration}
												</Link>
											))}
										</div>
									)}
									{!resource.description ? null : (
										<p className="pt-6 text-gray-400 break-words whitespace-pre-line">
											{resource.description}
										</p>
									)}
								</div>
								<div className="flex flex-row justify-center">
									{resource.video ? (
										<div className="pt-1 w-full 2xl:w-96">
											<div className="aspect-w-16 aspect-h-9">
												<iframe
													width="720"
													height="405"
													src={resource.video}
													title={resource.title}
													frameBorder="0"
													allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
													allowFullScreen
												/>
											</div>
										</div>
									) : (
										<div className="lg:max-w-sm 2xl:max-w-xs w-auto mx-auto">
											<a
												className="relative"
												href={resource.url}
												target="_blank"
												rel="noopener noreferrer"
											>
												<img
													className="max-h-96 rounded-lg bg-white"
													src={resource.image ?? getScreenshotURL(resource.url)}
													width="auto"
													height="auto"
													alt="cover"
												/>
											</a>
										</div>
									)}
								</div>
							</div>
						</div>
						{children}
					</div>
				</div>
			</PaneContent>
			<PaneFooter>
				<FlashMessage message={message ?? null} />
			</PaneFooter>
		</PaneContainer>
	);
}

export default ResourcesDetails;
