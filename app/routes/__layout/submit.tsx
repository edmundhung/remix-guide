import type { MetaFunction, ActionFunction } from 'remix';
import { Form, redirect, useLocation } from 'remix';
import { useMemo } from 'react';
import menuIcon from '~/icons/menu.svg';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import { Context } from '~/types';
import { formatMeta, isMaintainer } from '~/helpers';
import { toggleSearchParams } from '~/search';
import IconLink from '~/components/IconLink';
import { useSessionData } from '~/hooks';

export let meta: MetaFunction = () => {
	return formatMeta({
		title: 'Submit a new Resource',
		'og:url': 'https://remix.guide/submit',
	});
};

function isValidURL(text: string): boolean {
	try {
		const url = new URL(text);

		return (
			['http:', 'https:'].includes(url.protocol) &&
			!/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(url.hostname)
		);
	} catch (e) {
		return false;
	}
}

export let action: ActionFunction = async ({ request, context }) => {
	const { session, resourceStore } = context as Context;
	const profile = await session.isAuthenticated();

	if (!profile) {
		return redirect('/submit', {
			headers: await session.commitWithFlashMessage(
				'Please login first before submitting new resources',
				'warning',
			),
		});
	} else if (!isMaintainer(profile.name)) {
		return redirect('/submit', {
			headers: await session.commitWithFlashMessage(
				'Sorry. This feature is not enabled on your account yet.',
				'warning',
			),
		});
	}

	const formData = await request.formData();
	const url = formData.get('url');

	if (!url || !isValidURL(url.toString())) {
		return redirect('/submit', {
			headers: await session.commitWithFlashMessage(
				'Invalid URL provided',
				'warning',
			),
		});
	}

	try {
		const { id, status } = await resourceStore.submit(
			url.toString(),
			profile.id,
		);

		let setCookieHeader = {};

		switch (status) {
			case 'PUBLISHED':
				setCookieHeader = await session.commitWithFlashMessage(
					'The submitted resource is now published',
					'success',
				);
				break;
			case 'RESUBMITTED':
				setCookieHeader = await session.commitWithFlashMessage(
					'A resource with the same url is found',
					'info',
				);
				break;
			case 'INVALID':
				setCookieHeader = await session.commitWithFlashMessage(
					'The provided data looks invalid; Please make sure a proper category is selected',
					'error',
				);
				break;
		}

		if (!id) {
			return redirect('/submit', {
				headers: setCookieHeader,
			});
		}

		return redirect(
			`/discover?${new URLSearchParams({ resourceId: id, open: 'bookmark' })}`,
			{
				headers: setCookieHeader,
			},
		);
	} catch (error) {
		console.log('Error while submitting new url; Received', error);
		return redirect('/submit', {
			headers: await session.commitWithFlashMessage(
				'Something wrong with the URL; Please try again later',
				'error',
			),
		});
	}
};

export default function Submit() {
	const { message } = useSessionData();
	const location = useLocation();
	const toggleMenuURL = useMemo(
		() => `?${toggleSearchParams(location.search, 'menu')}`,
		[location.search],
	);

	return (
		<PaneContainer>
			<PaneHeader>
				<IconLink icon={menuIcon} to={toggleMenuURL} mobileOnly />
				<div className="flex-1 leading-8 line-clamp-1">
					Submit a new Resource
				</div>
			</PaneHeader>
			<PaneContent>
				<section className="px-2.5 pt-2">
					<Form className="lg:max-w-3xl" method="post">
						<div className="py-8">
							<label htmlFor="url" className="block pb-4">
								Please paste the URL here
							</label>
							<div className="flex flex-col sm:flex-row gap-4">
								<div className="flex-1">
									<input
										id="url"
										name="url"
										type="text"
										className="w-full h-8 px-4 py-2 bg-gray-900 text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
										autoFocus
									/>
								</div>
								<button
									type="submit"
									className="bg-gray-800 hover:bg-gray-200 hover:text-black rounded-md px-4 h-8"
								>
									Submit
								</button>
							</div>
						</div>
					</Form>
				</section>
			</PaneContent>
			<PaneFooter>
				<FlashMessage message={message} />
			</PaneFooter>
		</PaneContainer>
	);
}
