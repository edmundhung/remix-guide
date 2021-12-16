export type { Context } from './context';

export interface Env {
  GITHUB_TOKEN?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_CALLBACK_URL?: string;
  YOUTUBE_API_KEY?: string;
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
  | 'concepts'
  | 'tutorials'
  | 'packages'
  | 'templates'
  | 'examples'
  | 'others';

export interface Page {
  url: string;
  site?: string;
  author?: string;
  category?: Category;
  title?: string;
  description?: string;
  dependencies?: Record<string, string>;
  image?: string;
  video?: string;
}

export type SubmissionStatus = 'PUBLISHED' | 'RESUBMITTED' | 'INVALID_CATEGORY';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface Metadata
  extends Pick<
    Entry,
    | 'id'
    | 'url'
    | 'category'
    | 'author'
    | 'title'
    | 'description'
    | 'viewCounts'
    | 'bookmarkCounts'
    | 'createdAt'
  > {
  integrations: string[];
}

export interface Entry extends Page {
  id: string;
  viewCounts?: number;
  bookmarkCounts?: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface SearchOptions {
  keyword?: string;
  list?: 'bookmarks' | 'history' | null;
  author?: string | null;
  hostname?: string | null;
  categories?: Category[] | null;
  integrations?: string[] | null;
  excludes?: string[] | null;
  limit?: number;
  sortBy?: 'hotness' | null;
}
