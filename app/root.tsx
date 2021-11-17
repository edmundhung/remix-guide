import type { LinksFunction, MetaFunction, LoaderFunction } from 'remix';
import {
  Form,
  Meta,
  Links,
  Scripts,
  useLoaderData,
  LiveReload,
  useCatch,
  Outlet,
  Link,
  NavLink,
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
        <header className="sticky top-0 z-20 bg-white border-b flex flex-row items-center">
          <Link
            className="w-24 h-24 px-10 flex items-center justify-center bg-black text-white"
            to="/"
            prefetch="intent"
          >
            <span className="text-center">Remix Guide</span>
          </Link>
          <Form className="px-10 relative color-gray-300" method="get">
            <button className="absolute top-4" title="search" type="button">
              <svg
                width="15"
                height="15"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.75068 11.3405C1.65161 9.23359 1.65161 5.80439 3.75068 3.69748C4.76756 2.67681 6.11976 2.11292 7.55689 2.11292C8.99619 2.11292 10.3484 2.67681 11.3653 3.69748C13.4622 5.80439 13.4622 9.23359 11.3653 11.3405C9.2662 13.4452 5.84975 13.4452 3.75068 11.3405ZM18 16.4548L13.595 12.0333C15.7986 9.06529 15.5874 4.8471 12.9047 2.15226C10.0479 -0.715235 5.06587 -0.719606 2.21121 2.15226C-0.737072 5.10937 -0.737072 9.9286 2.21121 12.8857C3.68536 14.3654 5.62112 15.1041 7.55906 15.1041C9.14861 15.1041 10.7229 14.5752 12.0555 13.5785L16.4605 18L18 16.4548Z"
                  fill="currentColor"
                ></path>
              </svg>
            </button>
            <input
              className="pl-5 py-3 border-b focus:outline-none"
              type="search"
              placeholder="Search"
              name="q"
            />
          </Form>
          <nav className="px-2">
            <NavLink
              className={({ isActive }) =>
                `px-2 ${
                  isActive ? 'text-gray-900' : 'text-gray-300'
                } hover:text-gray-600 transition-colors`
              }
              to="articles"
              prefetch="intent"
            >
              <span>Articles</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `px-2 ${
                  isActive ? 'text-gray-900' : 'text-gray-300'
                } hover:text-gray-600 transition-colors`
              }
              to="packages"
              prefetch="intent"
            >
              <span>Packages</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `px-2 ${
                  isActive ? 'text-gray-900' : 'text-gray-300'
                } hover:text-gray-600 transition-colors`
              }
              to="templates"
              prefetch="intent"
            >
              <span>Templates</span>
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `px-2 ${
                  isActive ? 'text-gray-900' : 'text-gray-300'
                } hover:text-gray-600 transition-colors`
              }
              to="examples"
              prefetch="intent"
            >
              <span>Examples</span>
            </NavLink>
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
