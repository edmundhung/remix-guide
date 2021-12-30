import { Miniflare } from 'miniflare';
import { setupMock } from './mock.mjs';

async function preview() {
  const clearMock = setupMock();
  const mf = new Miniflare({
    wranglerConfigPath: true,
    bindings: {
      SESSION_SECERTS: 'ReMixGuIDe',
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-secret',
      GITHUB_CALLBACK_URL: 'https://localhost:8787/auth',
    },
    https: true,
  });

  const server = await mf.startServer();

  server.addListener('close', () => {
    clearMock();
  });
}

preview().catch((e) =>
  console.error('Unknown error caught during preview:', e)
);
