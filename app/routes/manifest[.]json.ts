import type { LoaderFunction } from 'remix';
import { json } from 'remix';

export let loader: LoaderFunction = () => {
	return json(
		{
			short_name: 'Remix Guide',
			name: 'Remix Guide',
			start_url: '/',
			display: 'standalone',
			background_color: '#171717',
			theme_color: '#e5e5e5',
			icons: [],
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=600',
			},
		},
	);
};
