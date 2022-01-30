import type { ActionFunction } from 'remix';
import { json, useActionData, redirect } from 'remix';
import BackupForm from '~/components/BackupForm';
import { notFound } from '~/helpers';
import type { Context } from '~/types';
import { administrators } from '~/config';

export let action: ActionFunction = async ({ params, request, context }) => {
	const { session, userStore } = context as Context;
	const profile = await session.isAuthenticated();

	if (!administrators.includes(profile?.name ?? '') || !params.userId) {
		throw notFound();
	}

	const formData = await request.formData();
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
					headers: await session.commitWithFlashMessage(
						'Please provide proper data before clicking restore',
						'error',
					),
				});
			}

			await userStore.restore(params.userId, JSON.parse(data.trim()));

			return redirect('/admin/users', {
				headers: await session.commitWithFlashMessage(
					`Data restored for user (${params.userId})`,
					'success',
				),
			});
		}
		default:
			return redirect('/admin/users', {
				headers: await session.commitWithFlashMessage(
					'Please select either backup or restore',
					'error',
				),
			});
	}
};

export default function AdminResources() {
	const data = useActionData();

	return (
		<section className="flex flex-col flex-1 px-2.5 pt-2">
			<h3 className="pb-4">User backup / restore</h3>
			<BackupForm data={data} />
		</section>
	);
}
