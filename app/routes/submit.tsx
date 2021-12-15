import React, { useState } from 'react';
import type { ActionFunction } from 'remix';
import { Form, redirect, json, useLoaderData } from 'remix';
import CategoryIcon from '~/components/CategoryIcon';
import Panel from '~/components/Panel';
import { categories } from '~/meta';
import { Context, Category } from '~/types';

function isValidURL(text: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol);
  } catch (e) {
    return false;
  }
}

function isValidCategory(category: string): boolean {
  return categories.includes(category);
}

function getDescription(category: Category): string | null {
  switch (category) {
    case 'concepts':
      return 'Ideas about Remix, about Frontend, about Web';
    case 'tutorials':
      return 'An article, a video, or a course teaching about Remix or web fundamental';
    case 'packages':
      return 'A published NPM package. Private registry is not supported';
    case 'templates':
      return 'A template built on top of Remix. It can be a GitHub repo or a gist';
    case 'examples':
      return 'An example app built with Remix. Only Github repo is accepted at the moment';
    case 'others':
      return 'Anything else not covered above';
  }

  return null;
}

function getPlaceholder(category: Category): string | null {
  switch (category) {
    case 'concepts':
      return 'e.g. https://kentcdodds.com/blog/why-i-love-remix';
    case 'tutorials':
      return 'e.g. https://www.youtube.com/watch?v=3XkU_DXcgl0';
    case 'packages':
      return 'e.g. https://www.npmjs.com/package/remix';
    case 'templates':
      return 'e.g. https://github.com/edmundhung/remix-worker-template';
    case 'examples':
      return 'e.g. https://github.com/edmundhung/remix-guide';
  }

  return null;
}

export let action: ActionFunction = async ({ request, context }) => {
  const { auth, store } = context as Context;
  const profile = await auth.isAuthenticated();

  if (!profile) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const url = formData.get('url');
  const category = formData.get('category');

  if (!isValidCategory(category)) {
    return redirect('/submit', {
      headers: await auth.commitWithFlashMessage(
        'Invalid category provided',
        'warning'
      ),
    });
  }

  if (!isValidURL(url)) {
    return redirect('/submit', {
      headers: await auth.commitWithFlashMessage(
        'Invalid url provided',
        'warning'
      ),
    });
  }

  try {
    const { id, status } = await store.submit(url, category, profile.id);

    let setCookieHeader = {};

    switch (status) {
      case 'PUBLISHED':
        setCookieHeader = await auth.commitWithFlashMessage(
          'The submitted resource is now published',
          'success'
        );
        break;
      case 'RESUBMITTED':
        setCookieHeader = await auth.commitWithFlashMessage(
          'A resource with the same url is found',
          'info'
        );
        break;
      case 'INVALID_CATEGORY':
        setCookieHeader = await auth.commitWithFlashMessage(
          'The provided URL does not match the choosen category; Pleae refine your selection and submit again',
          'error'
        );
        break;
    }

    if (!id) {
      return redirect('/submit', {
        headers: setCookieHeader,
      });
    }

    return redirect(`/resources/${id}`, {
      headers: setCookieHeader,
    });
  } catch (error) {
    console.log('Error while submitting new url; Received', error);
    return redirect('/submit', {
      headers: await auth.commitWithFlashMessage(
        'Something wrong with the URL; Please try again later',
        'error'
      ),
    });
  }
};

export let loader: LoaderFunction = async ({ context }) => {
  const { auth } = context as Context;
  const [message, setCookieHeader] = await auth.getFlashMessage();

  return json(
    {
      message,
    },
    {
      headers: setCookieHeader,
    }
  );
};

export default function Submit() {
  const [selected, setSelected] = useState<string | null>(null);
  const { message } = useLoaderData();
  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelected(e.currentTarget.value);
  };

  return (
    <Panel title="Submission" message={message}>
      <section className="px-3 pt-8">
        <Form className="lg:max-w-3xl" method="post" reloadDocument>
          <h3 className="">Please select a cateogry</h3>
          <div>
            {categories.map((category) => (
              <div className="mt-4" key={category}>
                <input
                  id={category}
                  className="peer hidden"
                  type="radio"
                  name="category"
                  value={category}
                  onChange={handleSelect}
                  checked={category === selected}
                />
                <label
                  className="cursor-pointer flex flex-col md:flex-row md:items-center gap-4 border peer-checked:border-white p-4"
                  htmlFor={category}
                >
                  <div className="flex items-center gap-4">
                    <CategoryIcon category={category} />
                    <div className="capitalize w-24">{category}</div>
                  </div>

                  <div className="">{getDescription(category)}</div>
                </label>
              </div>
            ))}
          </div>
          {selected === null ? null : (
            <div className="py-8">
              <div className="pb-4">Then, paste the URL here</div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    name="url"
                    type="text"
                    className="w-full h-8 px-4 py-2 bg-black text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
                    placeholder={getPlaceholder(selected) ?? 'URL'}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="shadow-inner bg-gray-800 hover:bg-gray-200 hover:text-black rounded-md px-4 h-8"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </Form>
      </section>
    </Panel>
  );
}
