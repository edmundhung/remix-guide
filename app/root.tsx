import type { LinksFunction, MetaFunction, LoaderFunction } from 'remix';
import {
  Meta,
  Links,
  Scripts,
  useLoaderData,
  LiveReload,
  useCatch,
  Outlet,
  ScrollRestoration,
  json,
} from 'remix';
import SidebarNavigation from '~/components/SidebarNavigation';
import { categories, platforms } from '~/meta';
import stylesUrl from '~/styles/tailwind.css';

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }];
};

export let meta: MetaFunction = () => {
  return {
    title: 'Remix Guide',
    description: 'An interactive list of awesome stuffs about Remix',
    viewport: 'width=device-width, initial-scale=1',
  };
};

export let loader: LoaderFunction = async ({ context }) => {
  const { languages } = await context.query('meta', 'data');
  const user = await context.auth.isAuthenticated();

  return json(
    {
      versions: [],
      categories,
      languages,
      platforms,
      user,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    }
  );
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
      <body className="relative w-full h-full min-h-screen flex bg-black text-gray-200 bg-gradient-to-bl from-gray-900 via-black to-gray-900">
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  );
}

export default function App() {
  let { categories, platforms, languages, versions, user } = useLoaderData();

  return (
    <Document>
      <nav className="w-64 border-r">
        <SidebarNavigation
          categories={categories}
          platforms={platforms}
          languages={languages}
          versions={versions}
          user={user}
        />
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
      <div className="min-h-screen py-4 flex flex-col justify-center items-center">
        <h1>Sorry, something went wrong...</h1>
      </div>
    </Document>
  );
}
