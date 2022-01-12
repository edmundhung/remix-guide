import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import About from '~/components/About';

export let loader: LoaderFunction = async ({ params }) => {
  throw redirect(`${params.owner}/bookmarks`);
};

export default function UserProfile() {
  return <About />;
}
