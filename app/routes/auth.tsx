import type { LoaderFunction } from 'remix';

export let loader: LoaderFunction = async ({ context }) => {
  return await context.auth.login();
};
