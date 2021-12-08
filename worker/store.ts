import type { Env, Category, Entry } from './types';
import { createEntriesService } from './entries';

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

export function createStore(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Store {
  const ENTRIES = createEntriesService(env);

  return {
    async search(options) {
      const list = await ENTRIES.list();
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
    },
    async query(id: string) {
      return await ENTRIES.get(id);
    },
    async submit(url: string) {
      return await ENTRIES.submit(url);
    },
    async refresh(id: string): void {
      // const entry = await ENTRIES.get(hash);
      // if (!entry) {
      //   return;
      // }
      // const page = await preview(url);
      // await entryCache.set(entry.id, {
      //   ...entry,
      //   ...createEntry(entry.id, page),
      // });
    },
    async bookmark(id: string) {
      throw new Error(`bookmark(${id}) is not implemented yet`);
    },
  };
}
