import type { LoaderFunction, ActionFunction } from '@remix-run/cloudflare';
import { json, redirect } from '@remix-run/cloudflare';
import { Link, Form, useLoaderData, useLocation } from '@remix-run/react';
import { requireAdministrator } from '~/helpers';
import { getSite } from '~/search';
import type { PageMetadata } from '~/types';

export let action: ActionFunction = async ({ context, request }) => {
	const { session, pageStore } = context;
	const [formData] = await Promise.all([
		request.formData(),
		requireAdministrator(context),
	]);
	const url = formData.get('url')?.toString();

	if (!url) {
		return new Response('Bad Request', { status: 400 });
	}

	await pageStore.refresh(url);

	return redirect(request.url, {
		headers: {
			'Set-Cookie': await session.flash(
				'Refresh successfull. Be aware that new content will be populated only after the cache is expired',
				'success',
			),
		},
	});
};

export let loader: LoaderFunction = async ({ context }) => {
	const { pageStore } = context;

	await requireAdministrator(context);

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
								Site
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Title
							</th>
							<th className="px-4 py-2 text-left border border-gray-700">
								Category
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
									{getSite(entry.url)}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									{entry.title ?? 'n/a'}
								</td>
								<td className="px-4 py-2 border border-gray-700">
									{entry.category}
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
