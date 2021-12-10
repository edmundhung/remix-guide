import type { ActionFunction } from 'remix';
import { Form, redirect, json, useActionData } from 'remix';
import Panel from '~/components/Panel';
import { Context } from '~/types';

function isValidURL(text: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol);
  } catch (e) {
    return false;
  }
}

export let action: ActionFunction = async ({ request, context }) => {
  const { auth, store } = context as Context;
  const profile = await auth.isAuthenticated();

  if (!profile) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const url = formData.get('url');

  if (!isValidURL(url)) {
    return json({ message: 'Invalid URL provided' }, { status: 422 });
  }

  try {
    const id = await store.submit(profile.id, url);

    return redirect(`/resources/${id}`);
  } catch (error) {
    console.log('Error while submitting new url; Received', error);
    return json(
      { message: 'Something wrong with the URL; Please try again later' },
      { status: 500 }
    );
  }
};

export default function Submit() {
  const error = useActionData();

  return (
    <Panel title="Submission">
      <section className="px-3 pt-8">
        <Form className="max-w-3xl" method="post" reloadDocument>
          <div className="flex flex-row gap-4">
            <div className="flex-1">
              <input
                name="url"
                type="text"
                className="w-full h-8 px-4 py-2 bg-black text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
                placeholder="URL"
              />
            </div>
            <button
              type="submit"
              className="shadow-inner bg-gray-800 hover:bg-gray-200 hover:text-black rounded-md px-4 h-8"
            >
              Submit
            </button>
          </div>
          {!error ? null : (
            <div className="mt-1 px-4 py-2 text-xs">{error.message}</div>
          )}
        </Form>
      </section>
    </Panel>
  );
}
