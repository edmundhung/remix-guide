import { Link, useLocation, useFetcher } from '@remix-run/react';
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import type { Resource } from '~/types';
import SvgIcon from '~/components/SvgIcon';
import linkIcon from '~/icons/link.svg';
import backIcon from '~/icons/back.svg';
import bookmarkIcon from '~/icons/bookmark.svg';
import {
	getSite,
	toggleSearchParams,
	getResourceURL,
	getSearchOptions,
} from '~/search';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import FlashMessage from '~/components/FlashMessage';
import type { User } from '~/types';
import IconLink from '~/components/IconLink';
import { platforms } from '~/config';
import { isAdministrator } from '~/helpers';
import { useLists } from '~/hooks';

interface ResourcesDetailsProps {
	resource: Resource;
	user: User | null;
	message?: string | null;
	children: ReactNode;
}

function ResourcesDetails({
	resource,
	user,
	message,
	children,
}: ResourcesDetailsProps): ReactElement {
	const { submit } = useFetcher();
	const bookmark = useFetcher();
	const lists = useLists();
	const location = useLocation();
	const [backURL, bookmarkURL] = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const searchOptions = getSearchOptions(
			`${location.pathname}${location.search}`,
		);
		const backURL = getResourceURL(searchOptions);
		const bookmarkURL = `?${toggleSearchParams(
			searchParams.toString(),
			'bookmark',
		)}`;

		return [backURL, bookmarkURL];
	}, [location.pathname, location.search]);

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
				{isAdministrator(user?.profile.name) ? (
					<div className="flex flex-row items-center">
						<IconLink icon={backIcon} to={bookmarkURL} rotateIcon />
					</div>
				) : null}
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
										<a className="sticky top-0" href={resource.url}>
											<h2 className="inline-block text-xl break-words">
												{resource.title ?? resource.url}
											</h2>
										</a>
									</div>
									<a
										className="hover:underline text-gray-400"
										href={resource.url}
									>
										<SvgIcon
											className="inline-block w-3 h-3 mr-2"
											href={linkIcon}
										/>
										{getSite(resource.url)}
									</a>
									{resource.integrations || resource.lists ? (
										<div className="pt-4 flex flex-wrap gap-2">
											{resource.lists
												?.flatMap(
													(slug) =>
														lists.find((list) => list.slug === slug) ?? [],
												)
												.map((list) => (
													<Link
														key={list.slug}
														className="text-xs bg-gray-700 hover:bg-gray-500 rounded-md px-2"
														to={getResourceURL({
															list: list.slug,
															sort: 'top',
														})}
													>
														{list.title}
													</Link>
												))}
											{resource.integrations?.map((integration) => (
												<Link
													key={integration}
													className="text-xs bg-gray-700 hover:bg-gray-500 rounded-md px-2"
													to={
														platforms.includes(integration)
															? getResourceURL({
																	sort: 'top',
																	platform: integration,
															  })
															: getResourceURL({
																	sort: 'top',
																	integrations: [integration],
															  })
													}
												>
													{integration}
												</Link>
											))}
										</div>
									) : null}
									{!resource.description ? null : (
										<p className="pt-6 text-gray-400 whitespace-pre-line [overflow-wrap:anywhere]">
											{resource.description}
										</p>
									)}
								</div>
								{resource.video || resource.image ? (
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
										) : resource.image ? (
											<div className="lg:max-w-sm 2xl:max-w-xs w-auto mx-auto">
												<a className="relative" href={resource.url}>
													<img
														className="max-h-96 rounded-lg bg-white"
														src={resource.image}
														width="auto"
														height="auto"
														alt="cover"
													/>
												</a>
											</div>
										) : null}
									</div>
								) : null}
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
