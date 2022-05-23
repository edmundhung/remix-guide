import type { ShouldReloadFunction } from '@remix-run/react';
import { Outlet, useLoaderData, useLocation } from '@remix-run/react';
import type { LoaderFunction } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import clsx from 'clsx';
import Progress from '~/components/Progress';
import SidebarNavigation from '~/components/SidebarNavigation';
import { Context } from '~/types';
import { useSessionData } from '~/hooks';

export let loader: LoaderFunction = async ({ context }) => {
	const { resourceStore } = context as Context;
	const guide = await resourceStore.getData();

	return json({
		lists: guide.metadata.lists,
	});
};

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
	return typeof submission !== 'undefined';
};

export default function Layout() {
	const { lists } = useLoaderData();
	const { profile } = useSessionData();
	const location = useLocation();
	const isMenuOpened =
		new URLSearchParams(location.search).get('open') === 'menu';

	return (
		<>
			<Progress />
			<nav
				className={clsx(
					'z-30 xl:block w-full lg:w-96 xl:w-64 border-r',
					isMenuOpened ? 'absolute xl:relative bg-gray-900' : 'hidden',
				)}
			>
				<SidebarNavigation profile={profile} lists={lists} />
			</nav>
			<main className={clsx('flex-1', { 'hidden lg:block': isMenuOpened })}>
				<Outlet />
			</main>
		</>
	);
}
