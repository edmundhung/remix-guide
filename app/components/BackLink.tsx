import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import backIcon from '~/icons/back.svg';
import { getResourcesSearchParams } from '~/search';

function BackLink(): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const search = useMemo(
    () => getResourcesSearchParams(location.search).toString(),
    [location.search]
  );

  return (
    <Link
      className="flex items-center justify-center w-6 h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
      to={search === '' ? '/' : `/resources?${search}`}
      onClick={(e) => {
        navigate(-1);
        e.preventDefault();
      }}
      replace
    >
      <SvgIcon className="w-3 h-3" href={backIcon} />
    </Link>
  );
}

export default BackLink;
