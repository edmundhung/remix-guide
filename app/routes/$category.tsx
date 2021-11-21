import type { LoaderFunction } from 'remix';
import { redirect } from 'remix';
import { notFound } from '~/helpers';
import { categories } from '~/meta';

export let loader: LoaderFunction = async ({ params }) => {
  const { category } = params;

  if (categories.includes(category)) {
    return redirect(`/search?category=${category}`);
  }

  throw notFound();
};

export default function CategoryList() {
  return null;
}
