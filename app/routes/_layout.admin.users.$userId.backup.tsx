import type { ActionArgs } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useActionData } from '@remix-run/react';
import { requireAdministrator, notFound } from '~/helpers';
import BackupForm from '~/components/BackupForm';

export async function action({ params, request, context }: ActionArgs) {
	const { session, userStore } = context;

	if (!params.userId) {
		throw notFound();
	}

	const [formData] = await Promise.all([
		request.formData(),
		requireAdministrator(context),
	]);
	const type = formData.get('type');

	switch (type) {
		case 'backup': {
			const data = await userStore.backup(params.userId);

			return json(data);
		}
		case 'restore': {
			const input = formData.get('data');
			const data = input ? input.toString() : '';

			if (data.trim() === '') {
				return redirect('/admin/users', {
					headers: {
						'Set-Cookie': await session.flash(
							'Please provide proper data before clicking restore',
							'error',
						),
					},
				});
			}

			await userStore.restore(params.userId, JSON.parse(data.trim()));

			return redirect('/admin/users', {
				headers: {
					'Set-Cookie': await session.flash(
						`Data restored for user (${params.userId})`,
						'success',
					),
				},
			});
		}
		default:
			return redirect('/admin/users', {
				headers: {
					'Set-Cookie': await session.flash(
						'Please select either backup or restore',
						'error',
					),
				},
			});
	}
}

export default function AdminResources() {
	const data = useActionData();

	return (
		<section className="flex flex-col flex-1 px-2.5 pt-2">
			<h3 className="pb-4">User backup / restore</h3>
			<BackupForm data={data} />
		</section>
	);
}
