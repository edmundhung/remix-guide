import { LoaderFunction, MetaFunction, redirect } from 'remix';
import { formatMeta } from '~/helpers';

export let meta: MetaFunction = () => {
	return formatMeta({
		title: 'Remix Guide',
		description: 'A platform for sharing everything about Remix',
		'og:url': 'https://remix.guide',
	});
};

export let loader: LoaderFunction = () => {
	throw redirect('/news');
};
