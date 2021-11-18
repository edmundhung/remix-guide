import type { MetaFunction, LinksFunction, LoaderFunction } from 'remix';
import { Form, useLoaderData } from 'remix';
import Masonry from '~/components/Masonry';
import Card from '~/components/Card';

export let meta: MetaFunction = () => {
  return {
    title: 'remix-worker-template',
    description:
      'Starter template for setting up a Remix app on Cloudflare Workers',
  };
};

export let action: ActionFunction = async () => {
  return null;
};

export let links: LinksFunction = () => {
  return [];
};

export let loader: LoaderFunction = async () => {
  return {
    articles: [
      {
        id: 'andwqiofqei',
        url: 'https://edmund.dev/articles/deploying-remix-app-on-cloudflare-workers',
        type: 'article',
        title: 'Deploying Remix app on Cloudflare Workers',
        description:
          'Step by step guide on how to deploy your remix app to Cloudflare Workers using the `remix-worker-template`',
        tags: ['Cloudflare Workers'],
      },
      {
        id: 'wrgrgrg',
        url: 'https://github.com/sergiodxa/remix-auth',
        type: 'packacge',
        title: 'remix-auth',
        description: 'Simple Authentication for Remix',
      },
      {
        id: '435frgg',
        url: 'https://github.com/jacob-ebey/remix-css-modules',
        type: 'template',
        title: 'remix-css-modules',
      },
      {
        id: 'rgjoer',
        url: 'https://kentcdodds.com',
        type: 'example',
        title: 'kentcdodds.com',
      },
      {
        id: 'gwrgjrig',
        url: 'https://www.youtube.com/watch?v=bfLFHp7Sbkg',
        type: 'other',
        title: 'CDN Caching, Static Site Generation, and Server Side Rendering',
      },
    ],
  };
};

export default function Index() {
  let { articles } = useLoaderData();

  return (
    <main className="p-4 sm:p-10">
      <div className="grid grid-cols-masonry pl-px pt-px">
        {articles.map((article) => (
          <Card
            key={article.id}
            className="-ml-px -mt-px"
            url={article.url}
            type={article.type}
            title={article.title}
            description={article.description}
            image={article.image}
            tags={article.tags}
          />
        ))}
      </div>
    </main>
  );
}
