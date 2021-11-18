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
        <header className="sticky top-0 z-20 bg-white sm:border-b flex flex-row items-center text-xs sm:text-base">
          <Link
            className="w-12 h-12 sm:w-24 sm:h-24 sm:px-10 flex items-center justify-center bg-black text-white"
            to="/"
            prefetch="intent"
          >
            <span className="text-center">Remix Guide</span>
          </Link>
          <div className="sm:px-5 lg:px-10 flex flex-grow flex-col lg:flex-row">
            <Form className="relative flex-grow color-gray-300" method="get">
              <div class="flex items-center flex-row-reverse">
                <input
                  id="search"
                  className="h-12 sm:h-auto w-full pr-4 pl-9 py-2 text-gray-700 border-b focus:outline-none focus:border-gray-700 appearance-none"
                  type="search"
                  name="q"
                  placeholder="Search"
                />
                <label htmlFor="search" className="-mr-7">
                  <svg
                    class="w-5 h-5 fill-current text-gray-500 z-10"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="black"
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </label>
              </div>
            </Form>
            <div className="hidden sm:flex flex-col sm:flex-row items-center pt-2">
              <div className="flex flex-row lg:px-10">
                <Form method="get">
                  <select className="px-2 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer appearance-none">
                    <option>Version</option>
                  </select>
                </Form>
                <Form method="get">
                  <select className="px-2 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer appearance-none">
                    <option>Platform</option>
                  </select>
                </Form>
              </div>
              <nav className="flex-grow sm:text-right">
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
            </div>
          </div>
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
