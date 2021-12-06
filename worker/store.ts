import { preview } from './preview';

export type Category =
  | 'others'
  | 'articles'
  | 'videos'
  | 'packages'
  | 'templates'
  | 'examples';

export interface Metadata {
  id: string;
  url: string;
  category: Category;
  author?: string;
  title: string;
  description?: string;
  language?: string;
  integrations?: string[];
  viewCounts?: number;
  bookmarkCounts?: number;
}

export interface Entry extends Metadata {
  image?: string;
  video?: string;
}

export interface SearchOptions {
  keyword: string;
  categories: Category[] | null;
  authors: string[] | null;
  integrations: string[] | null;
  languages: string[] | null;
}

export interface Store {
  query(id: string): Promise<Entry>;
  search(options: SearchOptions): Promise<Entry[]>;
  submit(url: string): Promise<string>;
  refresh(id: string): Promise<void>;
  bookmark(id: string): void;
}

export function createEntryCache(kvNamespace: KVNamespace) {
  return {
    async get(hash: string) {
      return await kvNamespace.get<Entry>(hash, 'json');
    },
    async list() {
      const result = await kvNamespace.list<Metadata>();

      return result.keys.flatMap((key) => key.metadata ?? []);
    },
    async set(hash: string, entry: Entry) {
      const metadata = getMetadata(entry);

      await kvNamespace.put(hash, JSON.stringify(entry), { metadata });
    },
  };
}

export function createStore<Env extends { CONTENT: KVNamespace }>(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Store {
  const entryCache = createEntryCache(env.CONTENT);

  return {
    async search(options) {
      const list = await entryCache.list();
      const result = search(list, options);

      return result;
    },
    async query(id: string) {
      const entry = await entryCache.get(id);

      return entry;
    },
    async submit(url: string) {
      let hash = await hashURL(url);
      let entry = await entryCache.get(hash);

      if (!entry) {
        const page = await preview(url);

        if (url !== page?.url) {
          hash = await hashURL(page?.url);
          entry = await entryCache.get(hash);
        }

        if (!entry) {
          await entryCache.set(hash, createEntry(hash, page));
        }
      }

      return hash;
    },
    async refresh(id: string): void {
      const entry = await entryCache.get(hash);

      if (!entry) {
        return;
      }

      const page = await preview(url);
      await entryCache.set(entry.id, {
        ...entry,
        ...createEntry(entry.id, page),
      });
    },
    async bookmark(id: string) {
      throw new Error(`bookmark(${id}) is not implemented yet`);
    },
  };
}

async function hashURL(url: string): string {
  const message = new TextEncoder().encode(url);
  const buffer = await crypto.subtle.digest('SHA-1', message);
  const hash = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  return hash;
}

function createEntry(id: string, page: Preview): Entry {
  let entry = {
    id,
    url: page.url,
    title: page.title,
    description: page.description,
    image: page.image,
  };

  switch (page.site) {
    case 'GitHub': {
      const [repo, description] = entry.title
        .replace('GitHub - ', '')
        .split(':');
      const [author, title] = repo.split('/');

      entry.title = title;
      entry.description = description;
      entry.author = author;
      break;
    }
    case 'Gist': {
      const [author] = entry.url
        .replace('https://gist.github.com/', '')
        .split('/');

      entry.author = author;
      entry.description = '';
      break;
    }
    case 'YouTube': {
      const videoId = new URL(entry.url).searchParams.get('v');

      entry.video = `https://www.youtube.com/embed/${videoId}`;
      break;
    }
  }

  return entry;
}

function search(list: Metadata[], options: SearchOptions): Metadata[] {
  const match = (wanted: string[] | null, value: string) => {
    if (!wanted) {
      return true;
    }

    return wanted.length > 0 && wanted.includes(value);
  };
  const result = list.filter(
    (item) =>
      true &&
      match(options.categories, item.category) &&
      match(options.author, item.author) &&
      match(options.languages, item.language)
    // && item.integrations?.some(integration => match(options.integrations, integration))
  );

  return result;
}

function getMetadata(entry: Entry): Metadata {
  return entry;
}
