import type {
  LinksFunction,
  MetaFunction,
  LoaderFunction,
  ShouldReloadFunction,
} from 'remix';
import {
  Meta,
  Links,
  Scripts,
  useLoaderData,
  useLocation,
  LiveReload,
  useCatch,
  Outlet,
  ScrollRestoration,
  json,
} from 'remix';
import Progress from '~/components/Progress';
import SidebarNavigation from '~/components/SidebarNavigation';
import type { Context } from '~/types';
import stylesUrl from '~/styles/tailwind.css';

export let links: LinksFunction = () => {
  return [
    { rel: 'stylesheet', href: stylesUrl },
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  ];
};

export let meta: MetaFunction = () => {
  return {
    'color-scheme': 'dark',
    viewport: 'width=device-width, initial-scale=1',
  };
};

export let loader: LoaderFunction = async ({ context }) => {
  const { session } = context as Context;
  const profile = await session.isAuthenticated();

  return json({
    profile,
    version: process.env.VERSION,
  });
};

/**
 * Not sure if this is a bad idea or not to minimise requests
 * But the only time this data change is when user login / logout
 * Which trigger a full page reload at the moment
 */
export const unstable_shouldReload: ShouldReloadFunction = () => {
  return false;
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
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
      </head>
      <body className="relative w-full h-full min-h-screen flex bg-gray-900 text-gray-200">
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  const { profile } = useLoaderData();
  const location = useLocation();
  const isMenuOpened = new URLSearchParams(location.search).has('menu');

  return (
    <Document>
      <Progress />
      <nav
        className={`${
          isMenuOpened ? 'absolute xl:relative bg-gray-900' : 'hidden'
        } z-40 xl:block w-full lg:w-96 xl:w-64 h-full border-r`}
      >
        <SidebarNavigation profile={profile} />
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
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
          <div className="min-h-screen py-4 flex flex-1 flex-col justify-center items-center">
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
      <div className="min-h-screen py-4 flex flex-1 flex-col justify-center items-center">
        <h1>Sorry, something went wrong...</h1>
      </div>
    </Document>
  );
}
