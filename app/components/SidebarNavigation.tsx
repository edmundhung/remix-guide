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

interface MenuProps {
  title?: string;
  value?: string;
  active?: string | null;
  onActive?: (title: string) => void;
  children: ReactNode;
}

function LinkMenu({
  title,
  value,
  active,
  onActive,
  children,
}: MenuProps): ReactElement {
  return (
    <div>
      {!title ? null : (
        <div className="sticky top-0 bg-black py-2 text-xs text-gray-500">
          <button
            type="button"
            className="relative w-full px-3 py-1.5 flex items-center gap-4 rounded-lg"
            onClick={() =>
              onActive((current) => (current !== title ? title : null))
            }
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {title === active ? (
                <SvgIcon className="w-2 h-2" href={collapseIcon} />
              ) : (
                <SvgIcon className="w-2 h-2" href={expandIcon} />
              )}
            </span>
            {title}
            {typeof value !== 'undefined' && title !== active ? (
              <div className="absolute left-32 text-gray-200">
                {value ? <span className="capitalize">{value}</span> : ''}
              </div>
            ) : null}
          </button>
        </div>
      )}
      {!title || title === active ? (
        <ul className="space-y-1 pb-4">
          {Array.isArray(children) ? (
            children.map((child, i) => <li key={i}>{child}</li>)
          ) : (
            <li key={i}>{children}</li>
          )}
        </ul>
      ) : null}
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
  const [active, setActive] = useState<string | null>('Categories');
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('q');
  const list = searchParams.get('list');
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
    <div className="h-full max-h-screen min-h-screen flex flex-col text-sm capitalize">
      <header className="px-5 py-4">
        <Form
          method="get"
          action={action}
          ref={formRef}
          onChange={handleChange}
        >
          <SearchInput name="q" value={keyword} />
          {category ? (
            <input type="hidden" name="category" value={category} />
          ) : null}
        </Form>
      </header>
      {list ? <input type="hidden" name="list" value={list} /> : null}
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
        <LinkMenu
          title="Categories"
          value={category}
          active={active}
          onActive={setActive}
        >
          {categories.map((option) => (
            <MenuItem key={option} to={action} name="category" value={option}>
              <CategoryIcon category={option} fallback /> {option}
            </MenuItem>
          ))}
        </LinkMenu>
        {integrations.length === 0 ? null : (
          <LinkMenu
            title="Integrations"
            value={integration[0] ?? ''}
            active={active}
            onActive={setActive}
          >
            {integrations.map((option) => (
              <MenuItem
                key={option}
                to={action}
                name="integration"
                value={option}
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  <SvgIcon className="inline-block w-3 h-3" href={circleIcon} />
                </span>{' '}
                {option}
              </MenuItem>
            ))}
          </LinkMenu>
        )}
        {platforms.length === 0 ? null : (
          <LinkMenu
            title="Platform"
            value={platform}
            active={active}
            onActive={setActive}
          >
            {platforms.map((option) => (
              <MenuItem key={option} to={action} name="platform" value={option}>
                <span className="w-4 h-4 flex items-center justify-center">
                  <SvgIcon className="inline-block w-3 h-3" href={circleIcon} />
                </span>{' '}
                {option}
              </MenuItem>
            ))}
          </LinkMenu>
        )}
        <LinkMenu>
          <MenuItem to="https://remix.run/docs">
            <SvgIcon className="w-4 h-4" href={remixIcon} /> Docs
          </MenuItem>
          <MenuItem to="https://github.com/remix-run/remix">
            <SvgIcon className="w-4 h-4" href={githubIcon} /> Github
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
