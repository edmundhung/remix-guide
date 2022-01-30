import type { ActionFunction } from 'remix';
import { json, useActionData, redirect } from 'remix';
import BackupForm from '~/components/BackupForm';
import { notFound } from '~/helpers';
import type { Context } from '~/types';
import { administrators } from '~/config';

export let action: ActionFunction = async ({ request, params, context }) => {
	const { session, guideStore } = context as Context;
	const profile = await session.isAuthenticated();

	if (!params.guide || !administrators.includes(profile?.name ?? '')) {
		throw notFound();
	}

	const formData = await request.formData();
	const type = formData.get('type');

	switch (type) {
		case 'backup': {
			const data = await guideStore.backup(params.guide);

			return json(data);
		}
		case 'restore': {
			const input = formData.get('data');
			const data = input ? input.toString() : '';

			if (data.trim() === '') {
				return redirect(request.url, {
					headers: await session.commitWithFlashMessage(
						'Please provide proper data before clicking restore',
						'error',
					),
				});
			}

			await guideStore.restore(params.guide, JSON.parse(data.trim()));

			return redirect(request.url, {
				headers: await session.commitWithFlashMessage(
					'Data restored',
					'success',
				),
			});
		}
		default:
			return redirect(request.url, {
				headers: await session.commitWithFlashMessage(
					'Please select either backup or restore',
					'error',
				),
			});
	}
};

export default function BackupGuide() {
	const data = useActionData();

	return (
		<section className="flex flex-col flex-1 px-2.5 pt-2">
			<h3 className="pb-4">Guide (news)</h3>
			<BackupForm data={data} />
		</section>
	);
}
