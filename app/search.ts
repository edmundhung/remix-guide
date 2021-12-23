import { SearchOptions } from '~/types';
import { platforms } from '~/config';

export function getResourcesSearchParams(search: string): URLSearchParams {
  const searchParams = new URLSearchParams(search);
  const supported = [
    'list',
    'q',
    'category',
    'platform',
    'integration',
    'author',
    'site',
    'menu', // For mobile
  ];

  for (const key of searchParams.keys()) {
    if (supported.includes(key)) {
      continue;
    }

    searchParams.delete(key);
  }

  return searchParams;
}

export function getSearchOptions(searchParams: URLSearchParams): SearchOptions {
  return {
    keyword: searchParams.get('q'),
    list: searchParams.get('list'),
    author: searchParams.get('author'),
    site: searchParams.get('site'),
    category: searchParams.get('category'),
    platform: searchParams.get('platform'),
    integrations: searchParams.getAll('integration'),
  };
}

export function getSite(url: string): string {
  return new URL(url).hostname;
}

export function createIntegrationSearch(value: string): string {
  const searchParams = new URLSearchParams();

  if (platforms.includes(value)) {
    searchParams.set('platform', value);
  } else {
    searchParams.set('integration', value);
  }

  return searchParams.toString();
}
