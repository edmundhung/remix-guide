import type { ActionFunction } from 'remix';
import { Form, json, useActionData, redirect } from 'remix';
import React from 'react';
import { notFound } from '~/helpers';
import type { Context } from '~/types';
import { administrators } from '~/config';

export let action: ActionFunction = async ({ request, context }) => {
	const { session, store } = context as Context;
	const profile = await session.isAuthenticated();

	if (!administrators.includes(profile?.name ?? '')) {
		throw notFound();
	}

	const formData = await request.formData();
	const type = formData.get('type');

	switch (type) {
		case 'backup': {
			const data = await store.backupResources();

			return json(data);
		}
		case 'restore': {
			const input = formData.get('data');
			const data = input ? input.toString() : '';

			if (data.trim() === '') {
				return redirect('/admin', {
					headers: await session.commitWithFlashMessage(
						'Please provide proper data before clicking restore',
						'error',
					),
				});
			}

			await store.restoreResources(JSON.parse(data.trim()));

			return redirect('/admin', {
				headers: await session.commitWithFlashMessage(
					'Data restored',
					'success',
				),
			});
		}
		default:
			return redirect('/admin', {
				headers: await session.commitWithFlashMessage(
					'Please select either backup or restore',
					'error',
				),
			});
	}
};

export default function AdminResources() {
	const data = useActionData();

	const handleConfirm = (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
	) => {
		if (!confirm('Are you sure?')) {
			e.preventDefault();
		}
	};

	return (
		<section className="flex flex-col flex-1 px-2.5 pt-2">
			<h3 className="pb-4">Resources backup / restore</h3>
			<Form className="flex flex-col flex-1" method="post">
				<textarea
					className="whitespace-pre font-mono w-full flex-1 px-4 py-2 bg-gray-900 text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
					name="data"
					defaultValue={JSON.stringify(data, null, 2)}
				/>
				<div className="flex gap-4 py-4">
					<button
						type="submit"
						className="bg-gray-800 hover:bg-gray-200 hover:text-black rounded-md px-4 h-8"
						name="type"
						value="backup"
					>
						Show backup
					</button>
					<button
						type="submit"
						className="bg-gray-800 hover:bg-gray-200 hover:text-black rounded-md px-4 h-8"
						name="type"
						value="restore"
						onClick={handleConfirm}
					>
						Restore data
					</button>
				</div>
			</Form>
		</section>
	);
}
