import { ReactElement, ReactNode, useEffect, useMemo, useRef } from 'react';
import { Form, Link, useSubmit, useTransition, useLocation } from 'remix';
import { capitalize, throttle } from '~/helpers';
import CategoryIcon from '~/components/CategoryIcon';
import SvgIcon from '~/components/SvgIcon';
import homeIcon from '~/icons/home.svg';
import historyIcon from '~/icons/history.svg';
import bookmarkIcon from '~/icons/bookmark.svg';
import githubIcon from '~/icons/github.svg';
import discordIcon from '~/icons/discord.svg';
import remixIcon from '~/icons/remix.svg';
import expandIcon from '~/icons/expand.svg';
import collapseIcon from '~/icons/collapse.svg';
import circleIcon from '~/icons/circle.svg';
import squareIcon from '~/icons/square.svg';
import timesIcon from '~/icons/times.svg';
import mapPinIcon from '~/icons/map-pin.svg';
import type { UserProfile } from '~/types';

interface SearchInputProps {
  name: string;
  value: string | null;
}

function SearchInput({ name, value }: SearchInputProps): ReactElement {
  return (
    <div className="flex items-center text-xs">
      <input
        className="h-8 w-full pr-10 pl-4 py-2 bg-black text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
        type="text"
        name={name}
        defaultValue={value ?? ''}
        autoFocus
        placeholder="Search"
        maxLength={24}
      />
      <button type="submit" className="-ml-7">
        <svg
          className="w-4 h-4 fill-current text-gray-500 z-10"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="black"
        >
          <path d="M0 0h24v24H0V0z" fill="none" />
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>
    </div>
  );
}

function getColor(index: number, step: number): string {
  const colors = [
    'text-red-500',
    'text-yellow-400',
    'text-green-200',
    'text-green-300',
    'text-blue-300',
    'text-blue-500',
    'text-indigo-300',
    'text-indigo-500',
    'text-purple-400',
    'text-pink-400',
  ];

  return colors[(index * step) % colors.length];
}

interface MenuProps {
  title?: string;
  name?: string;
  to?: string;
  value?: string | string[];
  defaultOpen?: boolean;
  children?: ReactNode;
}

function LinkMenu({
  title,
  name,
  to,
  value,
  defaultOpen,
  children,
}: MenuProps): ReactElement {
  const location = useLocation();
  const search = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);

    searchParams.delete(name);

    return searchParams.toString();
  }, [location.search, name]);

  const menu = children ? (
    <ul className="space-y-1">
      {Array.isArray(children) ? (
        children.map((child, i) => <li key={i}>{child}</li>)
      ) : (
        <li key={i}>{children}</li>
      )}
    </ul>
  ) : null;

  if (!title) {
    return <div className="py-4">{menu}</div>;
  }

  return (
    <details className="group" open={defaultOpen}>
      <summary className="list-none cursor-pointer sticky top-0 bg-black py-2 text-xs text-gray-500">
        <div className="relative w-full px-3 py-1.5 flex flex-row items-center gap-4 rounded-lg">
          <span className="w-4 h-4 flex items-center justify-center">
            {children ? (
              <>
                <SvgIcon
                  className="w-2 h-2 hidden group-open:inline-block"
                  href={collapseIcon}
                />
                <SvgIcon
                  className="w-2 h-2 inline-block group-open:hidden"
                  href={expandIcon}
                />
              </>
            ) : (
              <SvgIcon className="w-3 h-3 inline-block" href={mapPinIcon} />
            )}
          </span>
          <span className="w-16">{title}</span>
          {!value || value.length === 0 ? null : (
            <div
              className={`flex flex-1 text-gray-200 ${
                children ? 'group-open:hidden' : ''
              }`}
            >
              <span className="flex-1 w-px truncate break-words">
                {[].concat(value).sort().join(', ')}
              </span>
              <Link
                className="w-4 h-4 flex items-center justify-center hover:rounded-full hover:bg-gray-200 hover:text-black"
                to={search ? `${to}?${search}` : to}
              >
                <SvgIcon className="w-3 h-3" href={timesIcon} />
              </Link>
            </div>
          )}
        </div>
      </summary>
      {menu ? <div className="pb-4">{menu}</div> : null}
    </details>
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

      isActive = searchParams.getAll(name).includes(value);

      switch (name) {
        case 'list': {
          if (value !== null) {
            search = new URLSearchParams({ [name]: value }).toString();
          }
          break;
        }
        case 'category':
        case 'platform': {
          if (!isActive) {
            searchParams.set(name, value);
          } else {
            searchParams.delete(name);
          }

          search = searchParams.toString();
          break;
        }
        case 'integration': {
          let values = searchParams.getAll(name);

          searchParams.delete(name);

          if (!isActive) {
            values = values.concat(value);
          } else {
            values = values.filter((v) => v !== value);
          }

          for (let i = 0; i < values.length; i++) {
            if (i === 0) {
              searchParams.set(name, values[i]);
            } else {
              searchParams.append(name, values[i]);
            }
          }

          search = searchParams.toString();
        }
      }
    }

    return [isActive, search];
  }, [location, name, value]);
  const className = `px-3 py-1.5 flex items-center gap-4 transition-colors rounded-lg ${
    isActive
      ? 'shadow-inner bg-gray-800'
      : 'hover:shadow-inner hover:bg-gray-900'
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
    <Link className={className} to={search ? `${to}?${search}` : to}>
      {children}
    </Link>
  );
}

interface SidebarNavigationProps {
  categories: string[];
  platforms: string[];
  integrations: string[];
  user: UserProfile | null;
}

function SidebarNavigation({
  categories,
  platforms,
  integrations,
  user,
}: SidebarNavigationProps): ReactElement {
  const submit = useSubmit();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('q');
  const list = searchParams.get('list');
  const author = searchParams.get('author');
  const hostname = searchParams.get('hostname');
  const category = searchParams.get('category');
  const platform = searchParams.get('platform') ?? '';
  const integration = searchParams.getAll('integration') ?? [];
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

  return (
    <div className="h-full max-h-screen min-h-screen flex flex-col text-sm">
      <header className="px-5 py-4">
        <Form
          method="get"
          action={action}
          ref={formRef}
          onChange={handleChange}
        >
          <SearchInput name="q" value={keyword} />
          {list ? <input type="hidden" name="list" value={list} /> : null}
          {category ? (
            <input type="hidden" name="category" value={category} />
          ) : null}
          {platform ? (
            <input type="hidden" name="platform" value={platform} />
          ) : null}
          {integration.map((value) => (
            <input key={value} type="hidden" name="integration" value={value} />
          ))}
        </Form>
      </header>
      <section className="flex-1 px-5 divide-y overflow-y-auto">
        <LinkMenu>
          <MenuItem to="/" name="list" value={null}>
            <SvgIcon className="w-4 h-4" href={homeIcon} /> Home
          </MenuItem>
          <MenuItem to="/resources" name="list" value="bookmarks">
            <SvgIcon className="w-4 h-4" href={bookmarkIcon} /> Bookmarks
          </MenuItem>
          <MenuItem to="/resources" name="list" value="history">
            <SvgIcon className="w-4 h-4" href={historyIcon} /> History
          </MenuItem>
        </LinkMenu>
        {author ? (
          <LinkMenu title="Author" name="author" to={action} value={author} />
        ) : null}
        {hostname ? (
          <LinkMenu
            title="Hostname"
            name="hostname"
            to={action}
            value={hostname}
          />
        ) : null}
        <LinkMenu
          title="Category"
          name="category"
          to={action}
          value={capitalize(category)}
          defaultOpen
        >
          {categories.map((option) => (
            <MenuItem key={option} to={action} name="category" value={option}>
              <CategoryIcon category={option} fallback /> {capitalize(option)}
            </MenuItem>
          ))}
        </LinkMenu>
        {platforms.length === 0 ? null : (
          <LinkMenu
            title="Platform"
            name="platform"
            to={action}
            value={capitalize(platform)}
          >
            {platforms.map((option, index) => (
              <MenuItem key={option} to={action} name="platform" value={option}>
                <span className="w-4 h-4 flex items-center justify-center">
                  <SvgIcon
                    className={`inline-block w-2 h-2 ${getColor(index, 1)}`}
                    href={circleIcon}
                  />
                </span>{' '}
                {option}
              </MenuItem>
            ))}
          </LinkMenu>
        )}
        {integrations.length === 0 ? null : (
          <LinkMenu
            title="Integrations"
            name="integration"
            to={action}
            value={integration}
          >
            {[
              ...integrations,
              ...integration.filter((option) => !integrations.includes(option)),
            ].map((option, index) => (
              <MenuItem
                key={option}
                to={action}
                name="integration"
                value={option}
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  <SvgIcon
                    className={`inline-block w-2 h-2 ${getColor(index, 2)}`}
                    href={squareIcon}
                  />
                </span>{' '}
                {option}
              </MenuItem>
            ))}
          </LinkMenu>
        )}
        <LinkMenu>
          <MenuItem to="https://remix.run/docs">
            <SvgIcon className="w-4 h-4" href={remixIcon} /> Remix Docs
          </MenuItem>
          <MenuItem to="https://github.com/remix-run/remix">
            <SvgIcon className="w-4 h-4" href={githubIcon} /> Repository
          </MenuItem>
          <MenuItem to="https://discord.com/invite/remix">
            <SvgIcon className="w-4 h-4" href={discordIcon} /> Discord
          </MenuItem>
        </LinkMenu>
      </section>
      <footer className="px-5 py-3 border-t">
        {user ? (
          <Form action="/logout" method="post" reloadDocument>
            <button className="w-full py-1 text-center rounded-lg hover:shadow-md hover:shadow-inner hover:bg-gray-900">
              Logout
            </button>
          </Form>
        ) : (
          <Form action="/login" method="post" reloadDocument>
            <button className="w-full py-1 text-center rounded-lg hover:shadow-md hover:shadow-inner hover:bg-gray-900">
              Login with Github
            </button>
          </Form>
        )}
      </footer>
    </div>
  );
}

export default SidebarNavigation;
