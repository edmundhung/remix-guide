import { LoaderFunction, ActionFunction, Link } from 'remix';
import { Form, useLoaderData, useLocation, json, redirect } from 'remix';
import { administrators } from '~/config';
import { notFound } from '~/helpers';
import type { Context, PageMetadata } from '~/types';

export let action: ActionFunction = async ({ context, request }) => {
	const { session, pageStore } = context as Context;
	const [profile, formData] = await Promise.all([
		session.isAuthenticated(),
		request.formData(),
	]);
	const url = formData.get('url')?.toString();

	if (!profile) {
		return new Response('Unauthorized', { status: 401 });
	}

	if (!administrators.includes(profile.name)) {
		return new Response('Forbidden', { status: 403 });
	}

	if (!url) {
		return new Response('Bad Request', { status: 400 });
	}

	await pageStore.refresh(url);

	return redirect(request.url, {
		headers: await session.commitWithFlashMessage(
			'Refresh successfull. Be aware that new content will be populated only after the cache is expired',
			'success',
		),
	});
};

export let loader: LoaderFunction = async ({ context }) => {
	const { pageStore, session } = context as Context;
	const profile = await session.isAuthenticated();

	if (!administrators.includes(profile?.name ?? '')) {
		throw notFound();
	}

	const entries = await pageStore.listPageMetadata();

	return json({
		entries,
	});
};

export default function ListUsers() {
	const { entries } = useLoaderData<{ entries: PageMetadata[] }>();
	const location = useLocation();

	return (
		<section className="px-2.5 pt-2">
			<div className="flex flex-row gap-4">
				<h3 className="pb-4">Pages ({entries.length})</h3>
				<div>/</div>
				<div>
					<Link to="statistics" className="hover:underline">
						Statistics
					</Link>
				</div>
			</div>
			<div>
				<table className="w-full border-collapse">
					<thead className="bg-gray-800">
						<tr>
							<th className="px-4 py-2 text-left border border-gray-700">
								Title
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								URL
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Views
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Bookmarks
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Created
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Last Updated
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						{entries.map((entry) => (
							<tr key={entry.url}>
								<td className="px-4 py-2 border border-gray-700">
									{entry.title ?? entry.url}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									<a
										href={entry.url}
										onClick={(e) => {
											if (!entry.isSafe) {
												e.preventDefault();
											}
										}}
										className="hover:underline"
										title="Visit page"
										target="_blank"
										rel="noopener noreferrer"
									>
										{entry.isSafe ? 'Safe' : 'NOT SAFE'}
									</a>
								</td>
								<td className="px-4 py-2 border border-gray-700">
									{entry.viewCount}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									{entry.bookmarkCount}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									{entry.createdAt}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									{entry.updatedAt}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									<Form method="post">
										<input
											type="hidden"
											name="referer"
											value={`${location.pathname}${location.search}`}
										/>
										<input type="hidden" name="url" value={entry.url} />
										<button type="submit" className="hover:underline">
											Refresh
										</button>
									</Form>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
