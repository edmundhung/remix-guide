import type { LoaderArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { Link, Outlet, useLocation } from '@remix-run/react';
import { useMemo } from 'react';
import menuIcon from '~/icons/menu.svg';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import { toggleSearchParams } from '~/search';
import IconLink from '~/components/IconLink';
import { requireMaintainer, isAdministrator } from '~/helpers';
import { useSessionData } from '~/hooks';

export async function loader({ context }: LoaderArgs) {
	await requireMaintainer(context);

	return json({});
}

export default function Admin() {
	const location = useLocation();
	const { profile, message } = useSessionData();

	const toggleMenuURL = useMemo(
		() => `?${toggleSearchParams(location.search, 'menu')}`,
		[location.search],
	);

	return (
		<PaneContainer>
			<PaneHeader>
				<IconLink icon={menuIcon} to={toggleMenuURL} mobileOnly />
				<div className="flex-1 leading-8 line-clamp-1">Administrator</div>
				{isAdministrator(profile?.name) ? (
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
						<span>/</span>
						<Link to="statistics" className="hover:underline">
							Statistics
						</Link>
					</div>
				) : null}
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
