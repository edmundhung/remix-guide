import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';

export let loader: LoaderFunction = () => {
  return redirect('/');
};

export default function Resources() {
  return null;
}
