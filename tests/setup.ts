import { test as base, expect } from '@playwright/test';
import {
  fixtures,
  TestingLibraryFixtures,
} from '@playwright-testing-library/test/fixture';
import { Miniflare } from 'miniflare';
import { MockAgent, setGlobalDispatcher } from 'undici';

interface TestFixtures extends TestingLibraryFixtures {
  login: (name?: string) => Promise<void>;
}

interface WorkerFixtures {
  mf: Miniflare;
  port: number;
  mockAgent: MockAgent;
}

export { expect };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Setup queries from playwright-testing-library
  ...fixtures,

  login: async ({ page, queries, mockAgent }, use) => {
    async function loginAs(name = 'edmundhung') {
      const loginButton = await queries.findByText(/Login with GitHub/i);

      const github = mockAgent.get('https://github.com');
      const githubAPI = mockAgent.get('https://api.github.com');

      github
        .intercept({
          path: '/login/oauth/access_token',
          method: 'POST',
        })
        .reply(
          200,
          new URLSearchParams({
            access_token: 'a-platform-for-sharing-everything-about-remix',
            scope: 'emails',
            token_type: 'bearer',
          }).toString()
        );

      githubAPI
        .intercept({
          path: '/user',
          method: 'GET',
        })
        .reply(200, {
          id: 'dev',
          login: name,
          name: 'Remix Guide Developer',
          email: 'dev@remix.guide',
          avatar_url: null,
        });

      await page.route('/login', async (route, request) => {
        // It seems like there is no way to intercept request in the middle of the redirect
        // Due to limitation of the devtool protocol
        // We expect the browser is already redirected to github login page after the request
        const response = await page.request.fetch(request);
        const responseURL = new URL(response.url());
        const returnTo = responseURL.searchParams.get('return_to');

        // We need the `return_to` search params to find out all information we need
        if (!returnTo) {
          await route.abort();
          return;
        }

        const url = new URL(decodeURIComponent(returnTo), responseURL.origin);

        route.fulfill({
          status: 302,
          headers: {
            Location: `${url.searchParams.get(
              'redirect_uri'
            )}?code=remix-guide&state=${url.searchParams.get('state')}`,
          },
        });
      });

      await loginButton.click();
    }

    await use(loginAs);
  },

  // Assign a unique "port" for each worker process
  port: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, workerInfo) => {
      await use(3000 + workerInfo.workerIndex);
    },
    { scope: 'worker' },
  ],

  // Ensure visits works with relative path
  baseURL: ({ port }, use) => {
    use(`http://localhost:${port}`);
  },

  mockAgent: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const mockAgent = new MockAgent();
      setGlobalDispatcher(mockAgent);

      await use(mockAgent);

      mockAgent.disableNetConnect();
    },
    { scope: 'worker' },
  ],

  // Miniflare instance
  mf: [
    async ({ port }, use) => {
      const mf = new Miniflare({
        envPath: true,
        wranglerConfigPath: true,
        buildCommand: undefined,
        bindings: {
          SESSION_SECERTS: 'ReMixGuIDe',
          GITHUB_CLIENT_ID: 'test-client-id',
          GITHUB_CLIENT_SECRET: 'test-secret',
          GITHUB_CALLBACK_URL: `http://localhost:${port}/auth`,
        },
        port,
      });

      // Start the server.
      let server = await mf.startServer();

      // Use the server in the tests.
      await use(mf);

      // Cleanup.
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
    { scope: 'worker', auto: true },
  ],
});
