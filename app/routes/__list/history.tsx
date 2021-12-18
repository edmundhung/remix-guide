import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';

export let loader: LoaderFunction = () => {
  return redirect('/resources?list=history');
};

export default function History() {
  return null;
}
