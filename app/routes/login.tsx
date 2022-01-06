import type { LoaderFunction, ActionFunction } from 'remix';
import { notFound } from '~/helpers';

export let loader: LoaderFunction = async ({ context }) => {
  return notFound();
};

export let action: ActionFunction = async ({ context }) => {
  return await context.session.login();
};
