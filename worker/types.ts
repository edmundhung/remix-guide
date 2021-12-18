export type { Context } from './context';

export interface Env {
  GITHUB_TOKEN?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GITHUB_CALLBACK_URL?: string;
  YOUTUBE_API_KEY?: string;
  SESSION_SECERTS?: string;
  CONTENT: KVNamespace;
  RESOURCES_STORE: DurableObjectNamespace;
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

export type Category = 'tutorials' | 'packages' | 'examples' | 'others';

export interface Page {
  url: string;
  site?: string;
  author?: string;
  category?: Category;
  title?: string;
  description?: string;
  integrations?: string[];
  image?: string;
  video?: string;
}

export type SubmissionStatus = 'PUBLISHED' | 'RESUBMITTED' | 'INVALID';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export type ResourceMetadata = Pick<
  Resource,
  | 'id'
  | 'url'
  | 'category'
  | 'author'
  | 'title'
  | 'description'
  | 'integrations'
  | 'viewCounts'
  | 'bookmarkCounts'
  | 'createdAt'
>;

export interface Resource extends Page {
  id: string;
  viewCounts?: number;
  bookmarkCounts?: number;
  createdAt: string;
  createdBy: string;
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
