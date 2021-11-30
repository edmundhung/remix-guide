import { ReactElement, ReactNode } from 'react';
import { Link } from 'remix';
import { Menu as MenuIcon } from '~/icons/menu';
import { Back as BackIcon } from '~/icons/back';
import { useResourcesSearchParams } from '~/search';

interface ListProps {
  title: string;
  button?: 'back' | 'menu';
  children: ReactNode;
}

function List({ title, button, children }: ListProps): ReactElement {
  const searchParams = useResourcesSearchParams();
  const search = searchParams.toString();

  return (
    <section className="w-full h-full max-h-screen overflow-y-auto">
      <header className="sticky top-0 backdrop-blur flex items-center gap-2 z-20 px-8 py-4 text-sm">
        {button !== 'back' ? null : (
          <Link
            className="flex md:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
            to={search === '' ? '/' : `/resources?${search}`}
            prefetch="intent"
          >
            <BackIcon className="w-3 h-3" />
          </Link>
        )}
        {button !== 'menu' ? null : (
          <Link
            className="flex xl:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
            to={`?${search === '' ? 'menu' : `${search}&menu`}`}
            prefetch="intent"
          >
            <MenuIcon className="w-3 h-3" />
          </Link>
        )}
        <div className="line-clamp-1">{title}</div>
      </header>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

export default List;
