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

import stylesUrl from './styles/tailwind.css';

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }];
};

export let meta: MetaFunction = () => {
  return {
    viewport: 'width=device-width, initial-scale=1',
  };
};

export let loader: LoaderFunction = async () => {
  return { date: new Date() };
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
  let data = useLoaderData();

  return (
    <Document>
      <div className="min-h-screen flex flex-col">
        <header className="h-32 border-b flex flex-row items-center">
          <h1 className="flex-grow px-10 text-lg">Remix Guide</h1>
          <nav className="h-full flex flex-row">
            <Link
              className="border-l px-10 flex items-center justify-center"
              to="articles"
              prefetch="intent"
            >
              <span>Articles</span>
            </Link>
            <Link
              className="border-l px-10 flex items-center justify-center"
              to="packages"
              prefetch="intent"
            >
              <span>Packages</span>
            </Link>
            <Link
              className="border-l px-10 flex items-center justify-center"
              to="templates"
              prefetch="intent"
            >
              <span>Templates</span>
            </Link>
            <Link
              className="border-l px-10 flex items-center justify-center"
              to="examples"
              prefetch="intent"
            >
              <span>Examples</span>
            </Link>
          </nav>
        </header>
        <Outlet />
        <footer className="sm:px-10 p-5">
          <p>This page was rendered at {data.date.toLocaleString()}</p>
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
