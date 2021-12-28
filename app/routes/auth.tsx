import type { LoaderFunction } from 'remix';

export let loader: LoaderFunction = async ({ context }) => {
  return await context.session.login();
};
