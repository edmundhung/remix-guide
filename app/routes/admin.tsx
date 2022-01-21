import type { LoaderFunction } from 'remix';
import { Outlet, json, useLoaderData } from 'remix';
import MenuLink from '~/components/MenuLink';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import { notFound } from '~/helpers';
import type { Context } from '~/types';
import { administrators } from '~/config';

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

	return (
		<PaneContainer>
			<PaneHeader>
				<MenuLink />
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
