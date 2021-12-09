export type { Context } from './context';

export interface Env {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_CALLBACK_URL?: string;
  SESSION_SECERTS?: string;
  CONTENT: KVNamespace;
  ENTRIES_STORE: DurableObjectNamespace;
  USER_STORE: DurableObjectNamespace;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
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
