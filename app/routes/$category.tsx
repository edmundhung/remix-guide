import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import { notFound } from '~/helpers';

export let loader: LoaderFunction = async ({ params, context }) => {
  const { category } = params;

  if (await context.support(category)) {
    return redirect(`/search?category=${category}`);
  }

  throw notFound();
};

export default function CategoryList() {
  return null;
}
