import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Link, useLocation } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import menuIcon from '~/icons/menu.svg';

function MenuLink(): ReactElement {
	const location = useLocation();
	const searchWithMenuOpened = useMemo(() => {
		const searchParams = new URLSearchParams(location.search);

		searchParams.set('open', 'menu');

		return searchParams.toString();
	}, [location.search]);

	return (
		<Link
			className="flex xl:hidden items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
			to={`?${searchWithMenuOpened}`}
		>
			<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={menuIcon} />
		</Link>
	);
}

export default MenuLink;
