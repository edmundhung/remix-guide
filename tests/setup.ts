import { test as base, expect } from '@playwright/test';
import {
  fixtures,
  TestingLibraryFixtures,
} from '@playwright-testing-library/test/fixture';
import { Miniflare } from 'miniflare';

interface EnvironmentFixtures {
  mf: Miniflare;
  port: number;
}

export { expect };

export const test = base.extend<TestingLibraryFixtures, EnvironmentFixtures>({
  // Setup queries from playwright-testing-library
  ...fixtures,

  // Assign a unique "port" for each worker process
  port: [
    async ({}, use, workerInfo) => {
      await use(3000 + workerInfo.workerIndex);
    },
    { scope: 'worker' },
  ],

  // Ensure visits works with relative path
  baseURL: ({ port }, use) => {
    use(`http://localhost:${port}`);
  },

  // Miniflare instance
  mf: [
    async ({ port }, use) => {
      const mf = new Miniflare({
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
