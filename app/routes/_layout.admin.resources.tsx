import type { ActionFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { useActionData } from '@remix-run/react';
import { requireAdministrator } from '~/helpers';
import BackupForm from '~/components/BackupForm';

export let action: ActionFunction = async ({ request, context }) => {
	const { session, resourceStore } = context;
	const [formData] = await Promise.all([
		request.formData(),
		requireAdministrator(context),
	]);
	const type = formData.get('type');

	switch (type) {
		case 'backup': {
			const data = await resourceStore.backup();

			return json(data);
		}
		case 'restore': {
			const input = formData.get('data');
			const data = input ? input.toString() : '';

			if (data.trim() === '') {
				return redirect('/admin/resources', {
					headers: {
						'Set-Cookie': await session.flash(
							'Please provide proper data before clicking restore',
							'error',
						),
					},
				});
			}

			await resourceStore.restore(JSON.parse(data.trim()));

			return redirect('/admin/resources', {
				headers: {
					'Set-Cookie': await session.flash('Data restored', 'success'),
				},
			});
		}
		default:
			return redirect('/admin/resources', {
				headers: {
					'Set-Cookie': await session.flash(
						'Please select either backup or restore',
						'error',
					),
				},
			});
	}
};

export default function AdminResources() {
	const data = useActionData();

	return (
		<section className="flex flex-col flex-1 px-2.5 pt-2">
			<h3 className="pb-4">Resources backup / restore</h3>
			<BackupForm data={data} />
		</section>
	);
}
