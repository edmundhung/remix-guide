import type {
	LinksFunction,
	MetaFunction,
	LoaderFunction,
	ShouldReloadFunction,
} from 'remix';
import {
	Meta,
	Links,
	Scripts,
	LiveReload,
	useCatch,
	Outlet,
	json,
} from 'remix';
import type { Context } from '~/types';
import stylesUrl from '~/styles/tailwind.css';

export let links: LinksFunction = () => {
	return [
		{ rel: 'stylesheet', href: stylesUrl },
		{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
	];
};

export let meta: MetaFunction = () => {
	return {
		'color-scheme': 'dark',
		viewport: 'width=device-width, initial-scale=1',
	};
};

export let loader: LoaderFunction = async ({ context }) => {
	const { session } = context as Context;
	const [data, setCookieHeader] = await session.getData();

	return json(data, {
		headers: {
			'Set-Cookie': setCookieHeader,
		},
	});
};

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
	return submission?.formData.get('type') !== 'view';
};

function Document({
	children,
	title,
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				{title ? <title>{title}</title> : null}
				<Meta />
				<Links />
			</head>
			<body className="relative w-full min-h-screen flex bg-gray-900 text-gray-200">
				{children}
				<Scripts />
				{process.env.NODE_ENV === 'development' ? <LiveReload /> : null}
			</body>
		</html>
	);
}

export default function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	);
}

export function CatchBoundary() {
	let caught = useCatch();

	switch (caught.status) {
		case 401:
		case 404:
			return (
				<Document title={`${caught.status} ${caught.statusText}`}>
					<div className="min-h-screen py-4 flex flex-1 flex-col justify-center items-center">
						<h1>
							{caught.status} {caught.statusText}
						</h1>
					</div>
				</Document>
			);

		default:
			throw new Error(
				`Unexpected caught response with status: ${caught.status}`,
			);
	}
}

export function ErrorBoundary({ error }: { error: Error }) {
	console.error(error);

	return (
		<Document title="Uh-oh!">
			<div className="min-h-screen py-4 flex flex-1 flex-col justify-center items-center">
				<h1>Sorry, something went wrong...</h1>
			</div>
		</Document>
	);
}
