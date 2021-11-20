export interface Metadata {
  url: string;
  slug: string;
  category: string;
  author?: string;
  image?: string;
  title: string;
  description?: string;
  remixVersions: string[];
  platforms: string[];
}

export interface Article extends Metadata {
  category: 'articles';
  packages: string[];
}

export interface Video extends Metadata {
  category: 'videos';
  packages: string[];
}

export interface Package extends Metadata {
  category: 'packages';
}

export interface Template extends Metadata {
  category: 'templates';
}

export interface Example extends Metadata {
  category: 'examples';
}

export type Entry = Article | Video | Package | Template | Example;
