import type { LoaderFunction } from 'remix';
import { Link, Outlet, json, useLoaderData, useLocation } from 'remix';
import { useMemo } from 'react';
import menuIcon from '~/icons/menu.svg';
import SvgIcon from '~/components/SvgIcon';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import { notFound } from '~/helpers';
import type { Context } from '~/types';
import { administrators } from '~/config';
import { toggleSearchParams } from '~/search';

export let loader: LoaderFunction = async ({ context }) => {
	const { session } = context as Context;
	const profile = await session.isAuthenticated();

	if (!administrators.includes(profile?.name ?? '')) {
		throw notFound();
	}

	const [message, setCookieHeader] = await session.getFlashMessage();

	return json(
		{ message },
		{
			headers: setCookieHeader,
		},
	);
};

export default function Admin() {
	const { message } = useLoaderData();
	const location = useLocation();
	const toggleMenuURL = useMemo(
		() => `?${toggleSearchParams(location.search, 'menu')}`,
		[location.search],
	);

	return (
		<PaneContainer>
			<PaneHeader>
				<Link
					className="flex xl:hidden items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black"
					to={toggleMenuURL}
				>
					<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={menuIcon} />
				</Link>
				<div className="flex-1 leading-8 line-clamp-1">Administrator</div>
			</PaneHeader>
			<PaneContent>
				<Outlet />
			</PaneContent>
			<PaneFooter>
				<FlashMessage message={message} />
			</PaneFooter>
		</PaneContainer>
	);
}
