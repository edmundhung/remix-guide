import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';

export let loader: LoaderFunction = ({ params }) => {
	throw redirect(`/discover/${params.list}`);
};
