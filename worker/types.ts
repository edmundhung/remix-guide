import type { Auth } from './auth';
import type { Store } from './store';

export type { UserProfile } from './auth';
export type { Entry } from './store';

export interface Env {
  CONTENT: KVNamespace;
  ENTRIES_DO: DurableObjectNamespace;
}

export interface Context {
  auth: Auth;
  store: Store;
}

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
