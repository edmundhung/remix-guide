import { ReactElement, ReactNode } from 'react';
import { Link } from 'remix';
import { useResourcesSearch } from '~/search';
import SvgIcon from '~/components/SvgIcon';
import menuIcon from '~/icons/menu.svg';
import backIcon from '~/icons/back.svg';
import plusIcon from '~/icons/plus.svg';

interface PanelProps {
  title: string;
  type?: 'list' | 'details';
  children: ReactNode;
}

function Panel({ title, type, children }: PanelProps): ReactElement {
  const search = useResourcesSearch();

  return (
    <section className="w-full h-full max-h-screen overflow-y-auto">
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
        {type !== 'list' ? null : (
          <Link
            className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
            to="/submit"
          >
            <SvgIcon className="w-3 h-3" href={plusIcon} />
          </Link>
        )}
      </header>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

export default Panel;
