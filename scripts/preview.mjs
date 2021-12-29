import { Miniflare } from 'miniflare';

async function preview() {
  const mf = new Miniflare({
    wranglerConfigPath: true,
    bindings: {
      SESSION_SECERTS: 'ReMixGuIDe',
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-secret',
      GITHUB_CALLBACK_URL: 'http://localhost:8787/auth',
    },
  });

  await mf.startServer();
}

preview().catch((e) =>
  console.error('Unknown error caught during preview:', e)
);
