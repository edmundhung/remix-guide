import { Miniflare } from 'miniflare';
import { readFile } from 'fs/promises';

async function preview() {
  const mf = new Miniflare({
    script: `addEventListener("fetch", () => {});`,
    buildCommand: '',
    kvPersist: true,
  });

  const kvNamespace = await mf.getKVNamespace('CONTENT');
  const content = await readFile(new URL('../content.json', import.meta.url));
  const entries = JSON.parse(content);

  await Promise.all(
    entries.map(({ key, value, ...options }) =>
      kvNamespace.put(key, value, options)
    )
  );
}

preview().catch((e) => console.error('Unknown error caught during dev:', e));
