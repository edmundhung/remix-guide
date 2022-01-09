import { ReactElement, ReactNode, useMemo } from 'react';
import { Link, useLocation } from 'remix';
import clsx from 'clsx';
import { getResourcesSearchParams } from '~/search';

type Padding = 'none' | 'minimum' | 'maximum';

interface PaneContainerProps {
  children: ReactNode;
}

export function PaneContainer({ children }: PaneContainerProps): ReactElement {
  return (
    <section className="flex flex-col w-full h-full max-h-screen min-h-screen lg:overflow-y-auto">
      {children}
    </section>
  );
}

interface PaneHeaderProps {
  padding?: Padding;
  children: ReactNode;
}

export function PaneHeader({
  padding = 'maximum',
  children,
}: PaneHeaderProps): ReactElement {
  return (
    <header
      className={clsx('sticky top-0 bg-gray-900 border-b lg:border-none z-20', {
        'px-2.5 xl:px-5': padding !== 'none',
      })}
    >
      <div
        className={clsx('h-16 flex flex-row items-center gap-4', {
          'px-3': padding === 'maximum',
        })}
      >
        {children}
      </div>
    </header>
  );
}

interface PaneFooterProps {
  padding?: Padding;
  children: ReactNode;
}

export function PaneFooter({
  padding = 'none',
  children,
}: PaneFooterProps): ReactElement {
  return (
    <footer
      className={clsx('sticky bottom-0 bg-gray-900 z-20', {
        'px-2.5 xl:px-5': padding !== 'none',
      })}
    >
      <div className={clsx({ 'px-3': padding === 'maximum' })}>{children}</div>
    </footer>
  );
}

interface PaneContentProps {
  padding?: Padding;
  children: ReactNode;
}

export function PaneContent({
  padding = 'minimum',
  children,
}: PaneContentProps): ReactElement {
  return (
    <div
      className={clsx('flex flex-col flex-1', {
        'px-2.5 xl:px-5': padding !== 'none',
      })}
    >
      <div
        className={clsx('flex flex-col flex-1 divide-y py-2', {
          'px-3': padding === 'maximum',
        })}
      >
        {children}
      </div>
    </div>
  );
}

interface ListProps {
  title?: string;
  children: ReactNode;
}

export function List({ title, children }: ListProps): ReactElement {
  return (
    <div className="text-sm">
      {title ? (
        <div className="sticky top-0 bg-gray-900 py-2 text-xs text-gray-400">
          <div className="px-3 py-1.5">{title}</div>
        </div>
      ) : null}
      <div className={title ? 'pb-4' : 'py-4'}>
        <ul className="space-y-1">
          {Array.isArray(children) ? (
            children.map((child, i) => <li key={i}>{child}</li>)
          ) : (
            <li>{children}</li>
          )}
        </ul>
      </div>
    </div>
  );
}

interface ItemLinkProps {
  to: string;
  name?: string;
  value?: string | null;
  children: ReactNode;
}

export function ItemLink({
  to,
  name,
  value,
  children,
}: ItemLinkProps): ReactElement {
  const location = useLocation();
  const [isActive, search] = useMemo(() => {
    let search = '';
    let isActive = false;

    if (name) {
      const searchParams = getResourcesSearchParams(location.search);
      const values = searchParams.getAll(name);

      isActive = !value ? values.length === 0 : values.includes(value);
      search = !value ? '' : new URLSearchParams({ [name]: value }).toString();
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
    <Link className={className} to={search ? `${to}?${search}` : to}>
      {children}
    </Link>
  );
}
