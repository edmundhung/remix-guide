import React, { useState } from 'react';
import type { LoaderFunction, ActionFunction } from 'remix';
import { Form, redirect, json, useLoaderData } from 'remix';
import CategoryIcon from '~/components/CategoryIcon';
import { maintainers, categories } from '~/config';
import { Context, Category } from '~/types';
import type { MetaFunction } from 'remix';
import { formatMeta } from '~/helpers';
import MenuLink from '~/components/MenuLink';
import FlashMessage from '~/components/FlashMessage';
import { PaneContainer, PaneHeader, PaneFooter, PaneContent } from '~/layout';

export let meta: MetaFunction = () => {
  return formatMeta({
    title: 'Submit a new Resource',
    'og:url': 'https://remix.guide/submit',
  });
};

function isValidURL(text: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(text).protocol);
  } catch (e) {
    return false;
  }
}

function isValidCategory(category: string): boolean {
  return categories.includes(category as Category);
}

function getDescription(category: string): string | null {
  switch (category as Category) {
    case 'tutorials':
      return 'Article, video or course teaching about Remix';
    case 'packages':
      return 'Package designed specifically for Remix and is published on NPM';
    case 'examples':
      return 'App built with Remix and is hosted on GitHub repository';
    case 'others':
      return 'Anything else not covered above';
  }

  return null;
}

function getPlaceholder(category: string): string | null {
  switch (category as Category) {
    case 'tutorials':
      return 'e.g. https://kentcdodds.com/blog/super-simple-start-to-remix';
    case 'packages':
      return 'e.g. https://www.npmjs.com/package/remix';
    case 'examples':
      return 'e.g. https://github.com/edmundhung/remix-guide';
  }

  return null;
}

export let action: ActionFunction = async ({ request, context }) => {
  const { session, store } = context as Context;
  const profile = await session.isAuthenticated();

  if (!profile) {
    return redirect('/submit', {
      headers: await session.commitWithFlashMessage(
        'Please login first before submitting new resources',
        'warning'
      ),
    });
  } else if (!maintainers.includes(profile.name)) {
    return redirect('/submit', {
      headers: await session.commitWithFlashMessage(
        'Sorry. This feature is not enabled on your account yet.',
        'warning'
      ),
    });
  }

  const formData = await request.formData();
  const url = formData.get('url');
  const category = formData.get('category');
  const userAgent = request.headers.get('User-Agent');

  if (!category || !isValidCategory(category.toString())) {
    return redirect('/submit', {
      headers: await session.commitWithFlashMessage(
        'Invalid category provided',
        'warning'
      ),
    });
  }

  if (!url || !isValidURL(url.toString())) {
    return redirect('/submit', {
      headers: await session.commitWithFlashMessage(
        'Invalid url provided',
        'warning'
      ),
    });
  }

  if (!userAgent) {
    return redirect('/submit', {
      headers: await session.commitWithFlashMessage(
        'User-Agent is missing from the request header',
        'error'
      ),
    });
  }

  try {
    const { id, status } = await store.submit(
      url.toString(),
      category.toString(),
      userAgent.toString(),
      profile.id
    );

    let setCookieHeader = {};

    switch (status) {
      case 'PUBLISHED':
        setCookieHeader = await session.commitWithFlashMessage(
          'The submitted resource is now published',
          'success'
        );
        break;
      case 'RESUBMITTED':
        setCookieHeader = await session.commitWithFlashMessage(
          'A resource with the same url is found',
          'info'
        );
        break;
      case 'INVALID':
        setCookieHeader = await session.commitWithFlashMessage(
          'The provided data looks invalid; Please make sure a proper category is selected',
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
      headers: await session.commitWithFlashMessage(
        'Something wrong with the URL; Please try again later',
        'error'
      ),
    });
  }
};

export let loader: LoaderFunction = async ({ context }) => {
  const { session } = context as Context;
  const [message, setCookieHeader] = await session.getFlashMessage();

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
    <PaneContainer>
      <PaneHeader>
        <MenuLink />
        <div className="flex-1 leading-8 line-clamp-1">
          Submit a new Resource
        </div>
      </PaneHeader>
      <PaneContent>
        <section className="px-2.5 pt-2">
          <Form className="lg:max-w-3xl" method="post">
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
                    className="cursor-pointer flex flex-col md:flex-row md:items-center gap-4 border peer-checked:border-white p-4 rounded-lg"
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
                <label htmlFor="url" className="block pb-4">
                  Then, paste the URL here
                </label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      id="url"
                      name="url"
                      type="text"
                      className="w-full h-8 px-4 py-2 bg-gray-900 text-gray-200 border rounded-lg border-gray-600 focus:outline-none focus:border-white appearance-none"
                      placeholder={getPlaceholder(selected) ?? 'URL'}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-200 hover:text-black rounded-md px-4 h-8"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </Form>
        </section>
      </PaneContent>
      <PaneFooter>
        <FlashMessage message={message} />
      </PaneFooter>
    </PaneContainer>
  );
}
