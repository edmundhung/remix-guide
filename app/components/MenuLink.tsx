import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link, useLocation } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import menuIcon from '~/icons/menu.svg';
import { getResourcesSearchParams } from '~/search';

function MenuLink(): ReactElement {
  const location = useLocation();
  const searchWithMenuOpened = useMemo(() => {
    const searchParams = getResourcesSearchParams(location.search);

    searchParams.set('menu', 'open');

    return searchParams.toString();
  }, [location.search]);

  return (
    <Link
      className="flex xl:hidden items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
      to={`?${searchWithMenuOpened}`}
    >
      <SvgIcon className="w-3 h-3" href={menuIcon} />
    </Link>
  );
}

export default MenuLink;
