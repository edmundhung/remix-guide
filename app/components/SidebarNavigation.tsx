import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import { Form, Link, NavLink, useLocation } from 'remix';
import clsx from 'clsx';
import SvgIcon from '~/components/SvgIcon';
import logo from '~/icons/logo.svg';
import bookmarkIcon from '~/icons/bookmark.svg';
import historyIcon from '~/icons/history.svg';
import plusIcon from '~/icons/plus.svg';
import githubIcon from '~/icons/github.svg';
import discordIcon from '~/icons/discord.svg';
import timesIcon from '~/icons/times.svg';
import remixIcon from '~/icons/remix.svg';
import packageIcon from '~/icons/box-open.svg';
import repositoryIcon from '~/icons/map-signs.svg';
import othersIcon from '~/icons/mail-bulk.svg';
import type { UserProfile } from '~/types';
import {
	PaneContainer,
	PaneHeader,
	PaneFooter,
	PaneContent,
	List,
} from '~/layout';
import {
	getCategoryListName,
	getResourceURL,
	getSearchOptions,
	toggleSearchParams,
} from '~/search';
import { SearchOptions } from '~/types';
import IconLink from '~/components/IconLink';
import { isAdministrator, isMaintainer } from '~/helpers';

interface ExternalLinkProps {
	href: string;
	children: ReactNode;
}

function ExternalLink({ href, children }: ExternalLinkProps): ReactElement {
	return (
		<a
			className="px-3 py-1.5 flex items-center gap-4 transition-colors rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800"
			href={href}
			target="_blank"
			rel="noopener noreferrer"
		>
			{children}
		</a>
	);
}

interface SearchLinkProps
	extends Pick<SearchOptions, 'guide' | 'list' | 'category'> {
	children: ReactNode;
}

function SearchLink({
	guide,
	list,
	category,
	children,
}: SearchLinkProps): ReactElement {
	const location = useLocation();
	const [to, isActive] = useMemo(() => {
		const to = getResourceURL({ guide, list, category });
		const currentOptions = getSearchOptions(
			`${location.pathname}${location.search}`,
		);
		const isActive =
			(typeof guide === 'undefined' || guide === currentOptions.guide) &&
			(typeof list === 'undefined' || list === currentOptions.list) &&
			(typeof category === 'undefined' || category === currentOptions.category);

		return [to, isActive];
	}, [guide, list, category, location]);

	return (
		<Link
			className={clsx(
				'px-3 py-1.5 flex items-center gap-4 transition-colors rounded-lg',
				isActive
					? 'text-gray-200 bg-gray-700'
					: 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
			)}
			to={isActive ? '/' : to}
			prefetch="intent"
		>
			{children}
		</Link>
	);
}

interface MenuLinkProps {
	to: string;
	children: string;
}

function MenuLink({ to, children }: MenuLinkProps): ReactElement {
	const firstSpace = children.indexOf(' ');

	return (
		<NavLink
			to={to}
			className={({ isActive }) =>
				clsx(
					'px-3 py-1.5 flex items-center gap-4 transition-colors rounded-lg',
					isActive
						? 'text-gray-200 bg-gray-700'
						: 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
				)
			}
		>
			<span className="flex items-center justify-center w-4 h-4">
				{children.slice(0, firstSpace)}
			</span>{' '}
			{children.slice(firstSpace)}
		</NavLink>
	);
}

interface SidebarNavigationProps {
	profile: UserProfile | null;
}

function SidebarNavigation({ profile }: SidebarNavigationProps): ReactElement {
	const location = useLocation();
	const toggleMenuURL = useMemo(
		() => `?${toggleSearchParams(location.search, 'menu')}`,
		[location.search],
	);

	return (
		<PaneContainer>
			<PaneHeader>
				<h1 className="flex-1 text-lg">
					<Link
						className="w-full flex flex-row items-center gap-4"
						to="/"
						prefetch="intent"
					>
						<SvgIcon className="w-4 h-4" href={logo} />
						Remix Guide
					</Link>
				</h1>
				<IconLink icon={timesIcon} to={toggleMenuURL} mobileOnly />
			</PaneHeader>
			<PaneContent>
				<div className="lg:flex-1 divide-y">
					{profile ? (
						<List
							title={`Hi, ${profile.name}`}
							action={
								isMaintainer(profile.name) ? (
									<NavLink
										className={({ isActive }) =>
											clsx(
												'flex items-center justify-center gap-2',
												isActive ? 'text-white' : 'hover:text-gray-300',
											)
										}
										to="/submit"
										prefetch="intent"
									>
										<SvgIcon className="w-3 h-3" href={plusIcon} />
									</NavLink>
								) : null
							}
						>
							<SearchLink guide={profile.name} list="bookmarks">
								<SvgIcon className="w-4 h-4" href={bookmarkIcon} /> Bookmarks
							</SearchLink>
							<SearchLink guide={profile.name} list="history">
								<SvgIcon className="w-4 h-4" href={historyIcon} /> History
							</SearchLink>
						</List>
					) : null}
					<List title="News">
						<SearchLink guide="news" category="package">
							<SvgIcon className="w-4 h-4" href={packageIcon} />{' '}
							{getCategoryListName('package')}
						</SearchLink>
						<SearchLink guide="news" category="repository">
							<SvgIcon className="w-4 h-4" href={repositoryIcon} />{' '}
							{getCategoryListName('repository')}
						</SearchLink>
						<SearchLink guide="news" category="others">
							<SvgIcon className="w-4 h-4" href={othersIcon} />{' '}
							{getCategoryListName('others')}
						</SearchLink>
					</List>
					{isAdministrator(profile?.name) ? (
						<List title="Administrator">
							<MenuLink to="/admin/pages">🌐 Pages</MenuLink>
							<MenuLink to="/admin/users">👥 Users</MenuLink>
							<MenuLink to="/admin/resources">🗃 Backup / Restore</MenuLink>
						</List>
					) : null}
				</div>
				<div className="border-t">
					<List>
						<ExternalLink href="https://remix.run/docs">
							<SvgIcon className="w-4 h-4" href={remixIcon} /> Docs
						</ExternalLink>
						<ExternalLink href="https://github.com/remix-run/remix">
							<SvgIcon className="w-4 h-4" href={githubIcon} /> GitHub
						</ExternalLink>
						<ExternalLink href="https://discord.com/invite/remix">
							<SvgIcon className="w-4 h-4" href={discordIcon} /> Discord
						</ExternalLink>
					</List>
				</div>
			</PaneContent>
			<PaneFooter padding="minimum">
				{profile ? (
					<Form
						className="h-full flex items-center border-t"
						action="/logout"
						method="post"
						reloadDocument
					>
						<button className="w-full py-1 text-center rounded-lg hover:bg-gray-800">
							Logout
						</button>
					</Form>
				) : (
					<Form
						className="h-full flex items-center border-t"
						action="/login"
						method="post"
						reloadDocument
					>
						<button className="w-full py-1 text-center rounded-lg hover:bg-gray-800">
							Login with GitHub
						</button>
					</Form>
				)}
			</PaneFooter>
		</PaneContainer>
	);
}

export default SidebarNavigation;
