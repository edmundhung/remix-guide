import type { ActionFunction } from 'remix';
import { json, useActionData, redirect } from 'remix';
import { requireAdministrator } from '~/helpers';
import BackupForm from '~/components/BackupForm';
import type { Context } from '~/types';

export let action: ActionFunction = async ({ request, context }) => {
	const { session, pageStore } = context as Context;
	const [formData] = await Promise.all([
		request.formData(),
		requireAdministrator(context),
	]);
	const type = formData.get('type');

	switch (type) {
		case 'backup': {
			const data = await pageStore.backup();

			return json(data);
		}
		case 'restore': {
			const input = formData.get('data');
			const data = input ? input.toString() : '';

			if (data.trim() === '') {
				return redirect(request.url, {
					headers: {
						'Set-Cookie': await session.flash(
							'Please provide proper data before clicking restore',
							'error',
						),
					},
				});
			}

			await pageStore.restore(JSON.parse(data.trim()));

			return redirect(request.url, {
				headers: {
					'Set-Cookie': await session.flash('Data restored', 'success'),
				},
			});
		}
		default:
			return redirect(request.url, {
				headers: {
					'Set-Cookie': await session.flash(
						'Please select either backup or restore',
						'error',
					),
				},
			});
	}
};

export default function PageStatistics() {
	const data = useActionData();

	return (
		<section className="flex flex-col flex-1 px-2.5 pt-2">
			<h3 className="pb-4">Page Statistics</h3>
			<BackupForm data={data} />
		</section>
	);
}
