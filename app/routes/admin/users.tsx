import type { LoaderFunction } from 'remix';
import { Link, useLoaderData, json } from 'remix';
import { administrators } from '~/config';
import { notFound } from '~/helpers';
import type { Context, UserProfile } from '~/types';

export let loader: LoaderFunction = async ({ context }) => {
	const { userStore, session } = context as Context;
	const profile = await session.isAuthenticated();

	if (!administrators.includes(profile?.name ?? '')) {
		throw notFound();
	}

	const users = await userStore.listUserProfiles();

	return json({
		users,
	});
};

export default function ListUsers() {
	const { users } = useLoaderData<{ users: UserProfile[] }>();

	return (
		<section className="px-2.5 pt-2">
			<h3 className="pb-4">Users ({users.length})</h3>
			<div className="lg:max-w-3xl">
				<table className="w-full border-collapse">
					<thead className="bg-gray-800">
						<tr>
							<th className="px-4 py-2 text-left border border-gray-700">Id</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Name
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Email
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						{users.map((user) => (
							<tr key={user.id}>
								<td className="px-4 py-2 border border-gray-700">{user.id}</td>
								<td className="px-4 py-2 border border-gray-700">
									{user.name}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									{user.email ?? 'n/a'}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									<Link to={`${user.id}/backup`} className="hover:underline">
										Backup
									</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
