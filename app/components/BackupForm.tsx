import type { ReactElement } from 'react';
import { Form } from 'remix';

interface BackupFormProps {
	data: any;
}

function BackupForm({ data }: BackupFormProps): ReactElement {
	const dataSortedByKeys = !data
		? null
		: Object.keys(data)
				.sort()
				.reduce(
					(result, key) => Object.assign(result, { [key]: data[key] }),
					{} as Record<string, any>,
				);

	const handleConfirm = (
		e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
	) => {
		if (!confirm('Are you sure?')) {
			e.preventDefault();
		}
	};

	return (
		<Form className="flex flex-col flex-1" method="post">
			<textarea
				className="whitespace-pre font-mono w-full flex-1 px-4 py-2 bg-gray-900 text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
				name="data"
				defaultValue={
					dataSortedByKeys ? JSON.stringify(dataSortedByKeys, null, 2) : ''
				}
			/>
			<div className="flex gap-4 py-4">
				<button
					type="submit"
					className="bg-gray-800 hover:bg-gray-200 hover:text-black rounded-md px-4 h-8"
					name="type"
					value="backup"
				>
					Show data
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
	);
}

export default BackupForm;
