import type { ReactElement } from 'react';
import { Form, Link, useLocation, useNavigate } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import logo from '~/icons/logo.svg';
import homeIcon from '~/icons/home.svg';
import historyIcon from '~/icons/history.svg';
import bookmarkIcon from '~/icons/bookmark.svg';
import githubIcon from '~/icons/github.svg';
import discordIcon from '~/icons/discord.svg';
import timesIcon from '~/icons/times.svg';
import remixIcon from '~/icons/remix.svg';
import type { UserProfile } from '~/types';
import {
  PaneContainer,
  PaneHeader,
  PaneFooter,
  PaneContent,
  List,
  ItemLink,
} from '~/layout';

interface SidebarNavigationProps {
  profile: UserProfile | null;
}

function SidebarNavigation({ profile }: SidebarNavigationProps): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const searchPararms = new URLSearchParams(location.search);
  const hasMenu = searchPararms.get('open') === 'menu';

  if (hasMenu) {
    searchPararms.delete('open');
  }

  const search = searchPararms.toString();

  return (
    <PaneContainer>
      <PaneHeader>
        <h1 className="flex-1 flex flex-row items-center gap-4 text-lg h-10">
          <SvgIcon className="w-4 h-4" href={logo} />
          Remix Guide
        </h1>
        <Link
          className="flex xl:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
          to={
            search === '' ? location.pathname : `${location.pathname}?${search}`
          }
          onClick={(e) => {
            navigate(-1);
            e.preventDefault();
          }}
          replace
        >
          <SvgIcon className="w-3 h-3" href={timesIcon} />
        </Link>
      </PaneHeader>
      <PaneContent>
        <div className="lg:flex-1">
          <List title="Menu">
            <ItemLink to="/" name="list" value={null}>
              <SvgIcon className="w-4 h-4" href={homeIcon} /> Home
            </ItemLink>
            <ItemLink to="/resources" name="list" value="bookmarks">
              <SvgIcon className="w-4 h-4" href={bookmarkIcon} /> Bookmarks
            </ItemLink>
            <ItemLink to="/resources" name="list" value="history">
              <SvgIcon className="w-4 h-4" href={historyIcon} /> History
            </ItemLink>
          </List>
        </div>
        <div>
          <List>
            <ItemLink to="https://remix.run/docs">
              <SvgIcon className="w-4 h-4" href={remixIcon} /> Remix Docs
            </ItemLink>
            <ItemLink to="https://github.com/remix-run/remix">
              <SvgIcon className="w-4 h-4" href={githubIcon} /> Repository
            </ItemLink>
            <ItemLink to="https://discord.com/invite/remix">
              <SvgIcon className="w-4 h-4" href={discordIcon} /> Discord
            </ItemLink>
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
