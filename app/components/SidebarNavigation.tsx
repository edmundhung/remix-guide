import {
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Form, Link, useSubmit, useTransition, useLocation } from 'remix';
import { throttle } from '~/helpers';
import type { UserProfile } from '../../worker/auth';
import CategoryIcon from '~/components/CategoryIcon';
import { Home as HomeIcon } from '~/icons/home';
import { Trending as TrendingIcon } from '~/icons/trending';
import { Bookmark as BookmarkIcon } from '~/icons/bookmark';
import { Github as GithubIcon } from '~/icons/github';
import { Discord as DiscordIcon } from '~/icons/discord';
import { Remix as RemixIcon } from '~/icons/remix';
import { Expand as ExpandIcon } from '~/icons/expand';
import { Collapse as CollapseIcon } from '~/icons/collapse';

interface SearchInputProps {
  name: string;
  value: string | null;
}

function SearchInput({ name, value }: SearchInputProps): ReactElement {
  return (
    <div className="flex items-center flex-row-reverse text-xs">
      <input
        id="search"
        className="h-8 w-full pr-4 pl-9 py-2 bg-black text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
        type="text"
        name={name}
        defaultValue={value ?? ''}
        autoFocus
        placeholder="Search"
      />
      <label htmlFor="search" className="-mr-7">
        <svg
          className="w-4 h-4 fill-current text-gray-500 z-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="black"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </label>
    </div>
  );
}

interface MenuProps {
  title?: string;
  value?: string;
  children: ReactNode;
}

function LinkMenu({ title, value, children }: MenuProps): ReactElement {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      {!title ? null : (
        <div className="py-2 text-xs text-gray-500">
          <button
            type="button"
            className="relative w-full px-3 py-1.5 flex items-center gap-4 rounded-lg"
            onClick={() => setExpanded((b) => !b)}
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {expanded ? (
                <CollapseIcon className="w-2 h-2" />
              ) : (
                <ExpandIcon className="w-2 h-2" />
              )}
            </span>
            {title}
            {typeof value !== 'undefined' && !expanded ? (
              <div className="absolute left-32 text-gray-200">
                {value ? <span className="capitalize">{value}</span> : 'any'}
              </div>
            ) : null}
          </button>
        </div>
      )}
      {!expanded ? null : (
        <ul className="space-y-1 pb-4">
          {Array.isArray(children) ? (
            children.map((child, i) => <li key={i}>{child}</li>)
          ) : (
            <li key={i}>{children}</li>
          )}
        </ul>
      )}
    </div>
  );
}

interface SelectMenuProps {
  title: string;
  name: string;
  value: string | null;
  options: string[];
}

function SelectMenu({
  title,
  name,
  value,
  options,
}: SelectMenuProps): ReactElement {
  return (
    <div className="py-2 text-xs text-gray-500">
      <label className="relative flex items-center">
        <select
          className="w-full z-10 px-3 py-1.5 appearance-none pl-32 bg-transparent outline-none text-gray-200"
          name={name}
          defaultValue={value}
        >
          <option value="">any</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="absolute left-3 flex gap-4">
          <span className="w-4 h-4 flex items-center justify-center">
            <ExpandIcon className="w-2 h-2" />
          </span>
          {title}
        </div>
      </label>
    </div>
  );
}

interface MenuItemProps {
  to: string;
  name?: string;
  value?: string | null;
  children: ReactNode;
}

function MenuItem({ to, name, value, children }: MenuItemProps): ReactElement {
  const location = useLocation();
  const [isActive, search] = useMemo(() => {
    let search = '';
    let isActive = false;

    if (name) {
      let searchParams = new URLSearchParams(location.search);

      isActive = searchParams.get(name) === value;

      switch (name) {
        case 'list': {
          if (value !== null) {
            search = new URLSearchParams({ [name]: value }).toString();
          }
          break;
        }
        case 'category': {
          if (!isActive) {
            searchParams.set(name, value);
          } else {
            searchParams.delete(name);
          }

          search = searchParams.toString();
          break;
        }
      }
    }

    return [isActive, search];
  }, [location, name, value]);
  const className = `px-3 py-1.5 flex items-center gap-4 transition-colors rounded-lg ${
    isActive
      ? 'shadow-inner bg-gray-700'
      : 'hover:shadow-inner hover:bg-gray-800'
  }`;

  if (/http:\/\/|https:\/\/|\/\//.test(to)) {
    return (
      <a
        className={className}
        href={search ? `${to}?${search}` : to}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      className={className}
      to={search ? `${to}?${search}` : to}
      prefetch="intent"
    >
      {children}
    </Link>
  );
}

interface SidebarNavigationProps {
  categories: string[];
  platforms: string[];
  languages: string[];
  versions: string[];
  user: UserProfile | null;
}

function SidebarNavigation({
  user,
  categories,
  platforms,
  languages,
  versions,
}: SidebarNavigationProps): ReactElement {
  const submit = useSubmit();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('q');
  const list = searchParams.get('list');
  const category = searchParams.get('category');
  const version = searchParams.get('version') ?? '';
  const platform = searchParams.get('platform') ?? '';
  const language = searchParams.get('language') ?? '';
  const transition = useTransition();
  const handleSubmit = useMemo(() => throttle(submit, 200), [submit]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (
      transition.state === 'loading' &&
      transition.type === 'normalLoad' &&
      !transition.location.pathname.startsWith('/resources')
    ) {
      formRef.current.reset();
    }
  }, [transition]);

  function handleChange(event) {
    handleSubmit(event.currentTarget);
  }

  let action = location.pathname.startsWith('/resources')
    ? location.pathname
    : '/resources';
  console.log('location.pathname', location.pathname);

  return (
    <Form
      className="h-full max-h-screen overflow-y-auto flex flex-col text-sm capitalize"
      method="get"
      action={action}
      ref={formRef}
      onChange={handleChange}
    >
      <header className="px-5 py-4">
        <SearchInput name="q" value={keyword} />
      </header>
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      {list ? <input type="hidden" name="list" value={list} /> : null}
      <section className="flex-1 px-5 py-3 divide-y overflow-y-auto">
        <LinkMenu>
          <MenuItem to="/" name="list" value={null}>
            <HomeIcon className="w-4 h-4" /> Explore
          </MenuItem>
          <MenuItem to="/resources" name="list" value="trending">
            <TrendingIcon className="w-4 h-4" /> Trending
          </MenuItem>
          <MenuItem to="/resources" name="list" value="bookmarks">
            <BookmarkIcon className="w-4 h-4" /> Bookmarks
          </MenuItem>
        </LinkMenu>
        <LinkMenu title="Categories" value={category}>
          {categories.map((category) => (
            <MenuItem
              key={category}
              to={action}
              name="category"
              value={category}
            >
              <CategoryIcon category={category} fallback /> {category}
            </MenuItem>
          ))}
        </LinkMenu>
        {platforms.length === 0 ? null : (
          <SelectMenu
            title="Platform"
            name="platform"
            value={platform}
            options={platforms}
          />
        )}
        {languages.length === 0 ? null : (
          <SelectMenu
            title="Language"
            name="language"
            value={language}
            options={languages}
          />
        )}
        {versions.length === 0 ? null : (
          <SelectMenu
            title="Version"
            name="version"
            value={version}
            options={versions}
          />
        )}
        <LinkMenu title="Remix Official">
          <MenuItem to="https://remix.run/docs">
            <RemixIcon className="w-4 h-4" /> Docs
          </MenuItem>
          <MenuItem to="https://github.com/remix-run/remix">
            <GithubIcon className="w-4 h-4" /> Github
          </MenuItem>
          <MenuItem to="https://discord.com/invite/remix">
            <DiscordIcon className="w-4 h-4" /> Discord
          </MenuItem>
        </LinkMenu>
      </section>
      <footer className="px-5 py-3 border-t">
        {user ? (
          <Form action="/logout" method="post" reloadDocument>
            <button className="w-full py-1 text-center rounded-lg hover:shadow-md hover:shadow-inner hover:bg-gray-800">
              Logout
            </button>
          </Form>
        ) : (
          <Form action="/login" method="post" reloadDocument>
            <button className="w-full py-1 text-center rounded-lg hover:shadow-md hover:shadow-inner hover:bg-gray-800">
              Login
            </button>
          </Form>
        )}
      </footer>
    </Form>
  );
}

export default SidebarNavigation;
