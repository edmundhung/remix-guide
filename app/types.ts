export interface Metadata {
  url: string;
  slug: string;
  category: string;
  author?: string;
  image?: string;
  title: string;
  description?: string;
  version?: string;
  platforms: string[];
  packages?: string[];
  views?: number;
}

export interface Article extends Metadata {
  category: 'articles';
}

export interface Video extends Metadata {
  category: 'videos';
  video?: string;
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
