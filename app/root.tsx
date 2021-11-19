import type { LinksFunction, MetaFunction, LoaderFunction } from 'remix';
import {
  Meta,
  Links,
  Scripts,
  useLoaderData,
  LiveReload,
  useCatch,
  Outlet,
  Link,
} from 'remix';
import SearchForm from '~/components/SearchForm';
import stylesUrl from './styles/tailwind.css';

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }];
};

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Guide',
    viewport: 'width=device-width, initial-scale=1',
  };
};

export let loader: LoaderFunction = async () => {
  return {
    categories: ['articles', 'videos', 'packages', 'templates', 'others'],
    versions: ['v1.0.x', 'pre-v1'],
    platforms: [
      'architect',
      'aws',
      'azure',
      'cloudflare',
      'express',
      'firebase',
      'fly',
      'netlify',
      'render',
      'vercel',
    ],
  };
};

function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  let { categories, platforms, versions } = useLoaderData();

  return (
    <Document>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 bg-white sm:border-b flex flex-row items-center text-xs sm:text-base">
          <Link
            className="w-12 h-12 sm:w-24 sm:h-24 sm:px-10 flex items-center justify-center bg-black text-white"
            to="/"
            prefetch="intent"
          >
            <span className="text-center">Remix Guide</span>
          </Link>
          <SearchForm
            categories={categories}
            platforms={platforms}
            versions={versions}
          />
        </header>
        <main className="flex-grow p-4 sm:p-10">
          <Outlet />
        </main>
        <footer className="flex flex-col sm:flex-row justify-between sm:px-10 p-5 text-sm text-center sm:text-left">
          <p>
            Wanna share something? Submit it{' '}
            <Link className="underline" to="submit">
              here
            </Link>
          </p>
          <p>
            Made with{' '}
            <a
              className="hover:underline"
              href="https://remix.run"
              target="_blank"
              rel="noopener noreferrer"
            >
              Remix
            </a>{' '}
            by{' '}
            <a
              className="hover:underline"
              href="https://edmund.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ed
            </a>
          </p>
        </footer>
      </div>
    </Document>
  );
}

export function CatchBoundary() {
  let caught = useCatch();

  switch (caught.status) {
    case 401:
    case 404:
      return (
        <Document title={`${caught.status} ${caught.statusText}`}>
          <div className="min-h-screen py-4 flex flex-col justify-center items-center">
            <h1>
              {caught.status} {caught.statusText}
            </h1>
          </div>
        </Document>
      );

    default:
      throw new Error(
        `Unexpected caught response with status: ${caught.status}`
      );
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <Document title="Uh-oh!">
      <h1>App Error</h1>
      <pre>{error.message}</pre>
      <p>
        Replace this UI with what you want users to see when your app throws
        uncaught errors.
      </p>
    </Document>
  );
}
