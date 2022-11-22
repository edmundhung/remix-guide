import type { LoaderArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Link, Outlet, useLoaderData, useLocation } from '@remix-run/react';
import { useMemo } from 'react';
import menuIcon from '~/icons/menu.svg';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import { toggleSearchParams } from '~/search';
import IconLink from '~/components/IconLink';
import { requireAdministrator } from '~/helpers';

export async function loader({ context }: LoaderArgs) {
	await requireAdministrator(context);

	return json({});
}

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
				<div className="px-2.5 flex flex-row gap-4">
					<Link to="pages" className="hover:underline">
						Pages
					</Link>
					<span>/</span>
					<Link to="users" className="hover:underline">
						Users
					</Link>
					<span>/</span>
					<Link to="resources" className="hover:underline">
						Resources
					</Link>
				</div>
				<Outlet />
			</PaneContent>
			<PaneFooter>
				<FlashMessage message={message} />
			</PaneFooter>
		</PaneContainer>
	);
}
