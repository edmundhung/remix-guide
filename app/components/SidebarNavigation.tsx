import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';
import { Form, Link, NavLink, useLocation, useNavigate } from 'remix';
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
import tutorialscon from '~/icons/chalkboard-teacher.svg';
import packagesIcon from '~/icons/box-open.svg';
import examplesIcon from '~/icons/map-signs.svg';
import othersIcon from '~/icons/mail-bulk.svg';
import type { UserProfile } from '~/types';
import {
  PaneContainer,
  PaneHeader,
  PaneFooter,
  PaneContent,
  List,
} from '~/layout';
import { getResourceURL, getSearchOptions } from '~/search';
import { SearchOptions } from '~/types';
import { maintainers } from '~/config';

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
  extends Pick<SearchOptions, 'owner' | 'list' | 'category'> {
  children: ReactNode;
}

function SearchLink({
  owner,
  list,
  category,
  children,
}: SearchLinkProps): ReactElement {
  const location = useLocation();
  const [to, isActive, shouldReload] = useMemo(() => {
    const to = getResourceURL({ owner, list, category });
    const currentOptions = getSearchOptions(
      `${location.pathname}${location.search}`
    );
    const shouldReload = !location.search && !to.includes('?');
    const isActive =
      (typeof owner === 'undefined' || owner === currentOptions.owner) &&
      (typeof list === 'undefined' || list === currentOptions.list) &&
      (typeof category === 'undefined' || category === currentOptions.category);

    return [to, isActive, shouldReload];
  }, [owner, list, category, location]);

  return (
    <Link
      className={clsx(
        'px-3 py-1.5 flex items-center gap-4 transition-colors rounded-lg',
        isActive
          ? 'text-gray-200 bg-gray-700'
          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
      )}
      to={isActive ? '/' : to}
      reloadDocument={shouldReload}
    >
      {children}
    </Link>
  );
}

interface SidebarNavigationProps {
  profile: UserProfile | null;
}

function SidebarNavigation({ profile }: SidebarNavigationProps): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const search = useMemo(() => {
    const searchPararms = new URLSearchParams(location.search);
    const hasMenu = searchPararms.get('open') === 'menu';

    if (hasMenu) {
      searchPararms.delete('open');
    }

    return searchPararms.toString();
  }, [location.search]);

  return (
    <PaneContainer>
      <PaneHeader>
        <h1 className="flex-1 text-lg">
          <Link className="w-full flex flex-row items-center gap-4" to="/">
            <SvgIcon className="w-4 h-4" href={logo} />
            Remix Guide
          </Link>
        </h1>
        <Link
          className="flex xl:hidden items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
          to={
            search === '' ? location.pathname : `${location.pathname}?${search}`
          }
          onClick={(e) => {
            navigate(-1);
            e.preventDefault();
          }}
          replace
        >
          <SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={timesIcon} />
        </Link>
      </PaneHeader>
      <PaneContent>
        <div className="lg:flex-1 divide-y">
          {profile ? (
            <List
              title={`Hi, ${profile.name}`}
              action={
                maintainers.includes(profile.name) ? (
                  <NavLink
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center justify-center gap-2',
                        isActive ? 'text-white' : 'hover:text-gray-300'
                      )
                    }
                    to="/submit"
                  >
                    <SvgIcon className="w-3 h-3" href={plusIcon} />
                  </NavLink>
                ) : null
              }
            >
              <SearchLink owner={profile.name} list="bookmarks">
                <SvgIcon className="w-4 h-4" href={bookmarkIcon} /> Bookmarks
              </SearchLink>
              <SearchLink owner={profile.name} list="history">
                <SvgIcon className="w-4 h-4" href={historyIcon} /> History
              </SearchLink>
            </List>
          ) : null}
          <List title="Discover">
            <SearchLink owner={null} list={null} category="tutorials">
              <SvgIcon className="w-4 h-4" href={tutorialscon} /> Tutorial
            </SearchLink>
            <SearchLink owner={null} list={null} category="packages">
              <SvgIcon className="w-4 h-4" href={packagesIcon} /> Packages
            </SearchLink>
            <SearchLink owner={null} list={null} category="examples">
              <SvgIcon className="w-4 h-4" href={examplesIcon} /> Examples
            </SearchLink>
            <SearchLink owner={null} list={null} category="others">
              <SvgIcon className="w-4 h-4" href={othersIcon} /> Others
            </SearchLink>
          </List>
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
            className="py-3 border-t"
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
            className="py-3 border-t"
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
