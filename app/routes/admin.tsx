import type { LoaderFunction } from 'remix';
import { Outlet, useLoaderData, useLocation } from 'remix';
import { useMemo } from 'react';
import menuIcon from '~/icons/menu.svg';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import { isAdministrator, notFound } from '~/helpers';
import type { Context } from '~/types';
import { toggleSearchParams } from '~/search';
import IconLink from '~/components/IconLink';

export let loader: LoaderFunction = async ({ context }) => {
	const { session } = context as Context;
	const profile = await session.isAuthenticated();

	if (!isAdministrator(profile?.name)) {
		throw notFound();
	}
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
				<IconLink icon={menuIcon} to={toggleMenuURL} mobileOnly />
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
