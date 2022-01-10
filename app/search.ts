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
    'open', // For dialog
  ];

  for (const [key, value] of Array.from(searchParams.entries())) {
    if (!supported.includes(key) || value === '') {
      searchParams.delete(key);
    }
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

export function toggleSearchList(searchParams: URLSearchParams): string {
  const search = new URLSearchParams(searchParams);

  if (search.get('open') === 'search') {
    search.delete('open');
  } else {
    search.set('open', 'search');
  }

  return search.toString();
}
