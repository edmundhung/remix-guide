import type { ReactElement, ReactNode } from 'react';
import type { MessageType } from '~/types';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import menuIcon from '~/icons/menu.svg';
import backIcon from '~/icons/back.svg';
import timesIcon from '~/icons/times.svg';
import checkCircleIcon from '~/icons/check-circle.svg';
import timesCircleIcon from '~/icons/times-circle.svg';
import exclamationCircleIcon from '~/icons/exclamation-circle.svg';
import infoCircleIcon from '~/icons/info-circle.svg';
import { getResourcesSearchParams } from '~/search';

function formatMessage(message: string): ReactElement {
  const [type, content] = message.split(':');
  let icon: ReactElement | null = null;

  switch (type.trim() as MessageType) {
    case 'success':
      icon = checkCircleIcon;
      break;
    case 'error':
      icon = timesCircleIcon;
      break;
    case 'info':
      icon = infoCircleIcon;
      break;
    case 'warning':
      icon = exclamationCircleIcon;
      break;
  }

  return (
    <>
      {!icon ? null : <SvgIcon className="inline-block w-4 h-4" href={icon} />}
      <span>{content.trim()}</span>
    </>
  );
}

interface PanelProps {
  title: string;
  type?: 'list' | 'details';
  elements?: ReactElement;
  message?: string;
  children: ReactNode;
}

function Panel({
  title,
  type,
  elements,
  message,
  children,
}: PanelProps): ReactElement {
  const location = useLocation();
  const [search, searchWithMenuOpened] = useMemo(() => {
    const searchParams = getResourcesSearchParams(location.search);
    const search = searchParams.toString();

    searchParams.set('menu', 'open');

    return [search, searchParams.toString()];
  }, [location.search]);
  const [dimissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [message]);

  return (
    <section className="flex flex-col w-full h-full max-h-screen overflow-y-auto">
      <header className="sticky top-0 bg-gray-900 border-b md:border-none z-20 px-2.5 xl:px-5 py-4">
        <div className="flex items-center gap-2 text-sm px-3">
          {type !== 'details' ? (
            <Link
              className="flex xl:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
              to={`?${searchWithMenuOpened}`}
            >
              <SvgIcon className="w-3 h-3" href={menuIcon} />
            </Link>
          ) : (
            <Link
              className="flex md:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
              to={search === '' ? '/' : `/resources?${search}`}
              replace
            >
              <SvgIcon className="w-3 h-3" href={backIcon} />
            </Link>
          )}
          <div className="flex-1 leading-8 line-clamp-1">{title}</div>
          {elements}
        </div>
      </header>
      <div className="flex-1 px-2.5 xl:px-5 py-2">{children}</div>
      {!message || dimissed ? null : (
        <footer className="sticky bottom-0 flex items-center gap-4 bg-gray-700 px-5 py-3 text-sm">
          <div className="flex items-center flex-1 py-1 gap-4">
            {formatMessage(message)}
          </div>
          <button type="button" onClick={() => setDismissed(true)}>
            <SvgIcon className="w-3 h-3" href={timesIcon} />
          </button>
        </footer>
      )}
    </section>
  );
}

export default Panel;
