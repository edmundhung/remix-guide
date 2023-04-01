import type { MetaFunction, ActionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { Form, useLocation } from '@remix-run/react';
import { useMemo } from 'react';
import menuIcon from '~/icons/menu.svg';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';
import { formatMeta, isMaintainer } from '~/helpers';
import { toggleSearchParams } from '~/search';
import IconLink from '~/components/IconLink';
import { useSessionData } from '~/hooks';

export let meta: MetaFunction = () => {
	return formatMeta({
		title: 'Submit a new resource',
		description: 'Sharing with the community',
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

export async function action({ request, context }: ActionArgs) {
	const { session, resourceStore } = context;
	const profile = await session.getUserProfile();

	if (!profile) {
		return redirect('/submit', {
			headers: {
				'Set-Cookie': await session.flash(
					'Please login first before submitting new resources',
					'warning',
				),
			},
		});
	}

	const formData = await request.formData();
	const url = formData.get('url');

	if (!url || !isValidURL(url.toString())) {
		return redirect('/submit', {
			headers: {
				'Set-Cookie': await session.flash('Invalid URL provided', 'warning'),
			},
		});
	}

	try {
		const { id, status } = await resourceStore.submit(
			url.toString(),
			profile.id,
		);
		const headers = new Headers();

		switch (status) {
			case 'PUBLISHED':
				headers.set(
					'Set-Cookie',
					await session.flash(
						'The submitted resource is now published',
						'success',
					),
				);
				break;
			case 'RESUBMITTED':
				headers.set(
					'Set-Cookie',
					await session.flash('A resource with the same url is found', 'info'),
				);
				break;
			case 'INVALID':
				headers.set(
					'Set-Cookie',
					await session.flash(
						'The provided data looks invalid; Please make sure a proper category is selected',
						'error',
					),
				);
				break;
		}

		if (!id) {
			return redirect('/submit', { headers });
		}

		return redirect(
			isMaintainer(profile.name)
				? `/resources/${id}?${new URLSearchParams({ open: 'bookmark' })}`
				: `/resources/${id}`,
			{ headers },
		);
	} catch (error) {
		console.log('Error while submitting new url; Received', error);
		return redirect('/submit', {
			headers: {
				'Set-Cookie': await session.flash(
					'Something wrong with the URL; Please try again later',
					'error',
				),
			},
		});
	}
}

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
