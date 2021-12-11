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

export interface User {
  profile: UserProfile;
  viewed: string[];
  bookmarked: string[];
}

export type Category =
  | 'others'
  | 'articles'
  | 'videos'
  | 'packages'
  | 'templates'
  | 'examples';

export interface Page {
  url: string;
  author?: string;
  category?: Category;
  title?: string;
  description?: string;
  integrations?: string[];
  image?: string;
  video?: string;
}

export type Metadata = Omit<Entry, 'author' | 'image' | 'video'>;

export interface Entry extends Page {
  id: string;
  language?: string;
  viewCounts?: number;
  bookmarkCounts?: number;
}
