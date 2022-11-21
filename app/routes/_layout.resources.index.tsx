import type { MetaFunction } from '@remix-run/cloudflare';
import About from '~/components/About';
import { formatMeta } from '~/helpers';
import { getSearchOptions, getTitleBySearchOptions } from '~/search';

export const meta: MetaFunction = ({ location }) => {
	const searchOptions = getSearchOptions(
		`${location.pathname}${location.search}`,
	);
	const title = getTitleBySearchOptions(searchOptions);

	return formatMeta({
		title,
	});
};

export default function Index() {
	return <About />;
}
