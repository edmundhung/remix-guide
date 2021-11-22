import type { ActionFunction } from 'remix';

export let action: ActionFunction = async ({ context, params }) => {
  context.view(params.category, params.slug);

  return new Response('OK', { status: 200 });
};
