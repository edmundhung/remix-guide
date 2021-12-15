import { ReactElement, ReactNode, useEffect, useState } from 'react';
import { Link } from 'remix';
import { useResourcesSearch } from '~/search';
import SvgIcon from '~/components/SvgIcon';
import menuIcon from '~/icons/menu.svg';
import backIcon from '~/icons/back.svg';
import timesIcon from '~/icons/times.svg';
import checkCircleIcon from '~/icons/check-circle.svg';
import timesCircleIcon from '~/icons/times-circle.svg';
import exclamationCircleIcon from '~/icons/exclamation-circle.svg';
import infoCircleIcon from '~/icons/info-circle.svg';
import { MessageType } from '~/types';

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
  const search = useResourcesSearch();
  const [dimissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [message]);

  return (
    <section className="flex flex-col w-full h-full max-h-screen overflow-y-auto">
      <header className="sticky top-0 backdrop-blur flex items-center gap-2 z-20 px-8 py-4 text-sm">
        {type !== 'details' ? (
          <Link
            className="flex xl:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
            to={`?${search === '' ? 'menu' : `${search}&menu`}`}
            prefetch="intent"
          >
            <SvgIcon className="w-3 h-3" href={menuIcon} />
          </Link>
        ) : (
          <Link
            className="flex md:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
            to={search === '' ? '/' : `/resources?${search}`}
            prefetch="intent"
            replace
          >
            <SvgIcon className="w-3 h-3" href={backIcon} />
          </Link>
        )}
        <div className="flex-1 leading-8 line-clamp-1">{title}</div>
        {elements}
      </header>
      <div className="flex-1 px-5 py-3">{children}</div>
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
