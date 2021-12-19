import { SearchOptions } from '~/types';

export function getResourcesSearchParams(search: string): URLSearchParams {
  const searchParams = new URLSearchParams(search);
  const supported = [
    'list',
    'q',
    'category',
    'platform',
    'integration',
    'author',
    'hostname',
  ];

  for (const key of searchParams.keys()) {
    if (supported.includes(key)) {
      continue;
    }

    searchParams.delete(key);
  }

  return searchParams;
}

export function getSearchOptions(search: string): SearchOptions {
  const searchParams = getResourcesSearchParams(search);

  return {
    keyword: searchParams.get('q'),
    list: searchParams.get('list'),
    author: searchParams.get('author'),
    hostname: searchParams.get('hostname'),
    category: searchParams.get('category'),
    platform: searchParams.get('platform'),
    integrations: searchParams.getAll('integration'),
  };
}
