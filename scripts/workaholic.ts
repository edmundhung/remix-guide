import type { Entry, SetupBuildFunction } from '@workaholic/core';
import yaml from 'js-yaml';
import Fuse from 'fuse.js';
import { getLinkPreview } from 'link-preview-js';

const keys = [
  { name: 'category', weight: 5 },
  { name: 'author', weight: 4 },
  { name: 'title', weight: 3 },
  { name: 'description', weight: 1 },
  { name: 'remixVersions', weight: 5 },
  { name: 'platforms', weight: 4 },
];

async function previewMetadata(item: any): Promise<any> {
  const preview = (await getLinkPreview(item.url)) as any;

  switch (preview.siteName) {
    case 'GitHub': {
      const [repo, description] = preview.title
        .replace('GitHub - ', '')
        .split(':');
      const [author, title] = repo.split('/');

      return {
        ...item,
        title: item.category === 'packages' ? title : repo,
        description,
        author,
        image: preview.images[0],
      };
    }
    default:
      return {
        ...item,
        title: preview.title,
        description: preview.description,
        image: preview.images[0],
      };
  }
}

function createSearchEntries(items: any[]) {
  const index = Fuse.createIndex(keys, items).toJSON();

  return [
    { key: 'index', value: JSON.stringify(index) },
    { key: 'list', value: JSON.stringify(items) },
  ];
}

export let setupBuild: SetupBuildFunction = () => {
  return async (entries: Entry[]): Record<string, Entry[]> => {
    const items = await Promise.all(
      entries.flatMap((entry) => {
        const key = entry.key.replace(/.yml$/, '');
        const data = yaml.load(Buffer.from(entry.value).toString('utf-8'));
        const list = Object.entries(data).map(([slug, details]) => {
          const [category, ...keyParts] = `${key}/${slug}`.split('/');

          return {
            slug: keyParts.join('/'),
            category,
            ...details,
          };
        });

        return list.map((item) => previewMetadata(item));
      })
    );
    const result = items.reduce((result, item) => {
      if (typeof result[item.category] === 'undefined') {
        result[item.category] = [];
      }

      result[item.category].push({
        key: item.slug,
        value: JSON.stringify(item),
      });

      return result;
    }, {});

    return {
      ...result,
      meta: [{ key: 'category', value: JSON.stringify(Object.keys(result)) }],
      search: createSearchEntries(items),
    };
  };
};
