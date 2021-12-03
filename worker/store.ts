import { createQuery } from './query';

export type Category =
  | 'others'
  | 'articles'
  | 'videos'
  | 'packages'
  | 'templates'
  | 'examples';

export interface Entry {
  id: string;
  url: string;
  category: Category;
  author?: string;
  title: string;
  description?: string;
  image?: string;
  video?: string;
  language?: string;
  integrations?: string[];
  viewCounts?: number;
  bookmarkCounts?: number;
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
  submit(url: string, type: string): Promise<string>;
  scheduleUpdate(id: string): Promise<void>;
  bookmark(id: string): void;
}

export function createStore<Env>(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Store {
  const query = createQuery(env, ctx);

  return {
    async search(params = {}) {
      const { keyword, ...options } = params;
      const list = await query('search', keyword ?? '', {
        ...options,
        platform: options.integrations?.[0] ?? null,
        language: options.languages?.[0] ?? null,
      });

      return list;
    },
    async query(id: string) {
      const index = id.indexOf('-');
      const category = id.slice(0, index);
      const slug = id.slice(index + 1);

      if (category === 'search') {
        return null;
      }

      const result = await query(category, slug);

      if (!result) {
        return null;
      }

      return result;
    },
    async submit(url: string, type: string) {
      throw new Error(`submit(${url}, ${type}) is not implemented yet`);
    },
    async scheduleUpdate(id: string) {
      throw new Error(`scheduleUpdate(${id}) is not implemented yet`);
    },
    async bookmark(id: string) {
      throw new Error(`bookmark(${id}) is not implemented yet`);
    },
  };
}
