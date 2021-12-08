import type { Entry, Metadata, Env } from './types';
import { createEntry } from './preview';

/**
 * Entries - Durable object
 * @see https://developers.cloudflare.com/workers/learning/using-durable-objects
 */
export class Entries {
  state: DurableObjectState;
  env: Env;
  entryIdByURL: Record<string, string | null>;

  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get('entryIdByURL');
      this.entryIdByURL = stored || {};
    });
  }

  async fetch(request: Request) {
    try {
      let url = new URL(request.url);
      let method = request.method.toUpperCase();

      if (method === 'POST') {
        switch (url.pathname) {
          case '/submit': {
            const formData = await request.formData();
            const url = formData.get('url');
            const id = await this.createEntry(url);
            const body = new URLSearchParams({ id });

            return new Response(body, { status: 201 });
          }
        }
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.log(
        `Entries failed while handling a fetch call - ${request.url}; Received message: ${e.message}`
      );

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  async createEntry(url: string) {
    let id = this.entryIdByURL[url] ?? null;

    if (!id) {
      const entry = await createEntry(url);

      if (url !== entry.url) {
        id = await this.createEntry(entry.url);
      }

      if (!id) {
        id = entry.id;

        this.state.storage.put(id, entry);
        this.env.CONTENT.put(`entry/${id}`, JSON.stringify(entry), {
          metadata: getMetadata(entry),
        });
      }

      this.entryIdByURL[url] = id;
      this.state.storage.put('entryIdByURL', this.entryIdByURL);
    }

    return id;
  }
}

export function createEntriesService(env: Env) {
  const kvNamespace = env.CONTENT;
  const durableObjectNamespace = env.ENTRIES_DO;
  const id = durableObjectNamespace.idFromName('');
  const entries = durableObjectNamespace.get(id);

  return {
    async get(id: string) {
      return await kvNamespace.get<Entry>(`entry/${id}`, 'json');
    },
    async list() {
      const result = await kvNamespace.list<Metadata>({
        prefix: 'entry/',
      });

      return result.keys.flatMap((key) => key.metadata ?? []);
    },
    async submit(url: string) {
      const body = new URLSearchParams({ url });
      const response = await entries.fetch('http://entries/submit', {
        method: 'POST',
        body,
      });
      const formData = await response.formData();
      const id = formData.get('id');

      if (!id) {
        throw new Error('Submission failed; Entry id is missing');
      }

      return id;
    },
  };
}

function getMetadata(entry: Entry): Metadata {
  return {
    id: entry.id,
    url: entry.url,
    category: entry.category,
    author: entry.author,
    title: entry.title,
    description: entry.description,
    language: entry.language,
    integrations: entry.integrations,
    viewCounts: entry.viewCounts,
    bookmarkCounts: entry.bookmarkCounts,
  };
}
