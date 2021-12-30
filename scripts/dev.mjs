import { Miniflare } from 'miniflare';
import { setupMock } from './mock.mjs';

async function dev() {
  const clearMock = setupMock();
  const mf = new Miniflare({
    wranglerConfigPath: true,
    buildCommand: 'node ./scripts/build.mjs',
    buildWatchPaths: ['./build/index.js', './worker'],
    envPath: true,
    kvPersist: true,
    durableObjectsPersist: true,
    watch: true,
    open: true,
  });

  const server = await mf.startServer();

  server.addListener('close', () => {
    clearMock();
  });
}

dev().catch((e) => console.error('Unknown error caught during dev:', e));
