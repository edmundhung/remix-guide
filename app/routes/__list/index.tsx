import type { MetaFunction } from 'remix';
import About from '~/components/About';
import { formatMeta } from '~/helpers';

export let meta: MetaFunction = () => {
	return formatMeta({
		title: 'Remix Guide',
		description: 'A platform for sharing everything about Remix',
		'og:url': 'https://remix.guide',
	});
};

export default About;
