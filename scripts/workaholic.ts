import type { Entry, SetupBuildFunction } from '@workaholic/core';
import yaml from 'js-yaml';
import Fuse from 'fuse.js';
import { getLinkPreview } from 'link-preview-js';

export let setupBuild: SetupBuildFunction = () => {
  const keys = [
    { name: 'category', weight: 1 },
    { name: 'author', weight: 2 },
    { name: 'title', weight: 3 },
    { name: 'description', weight: 1 },
    { name: 'version', weight: 1 },
    { name: 'platforms', weight: 2 },
    { name: 'packages', weight: 1 },
  ];

  async function previewMetadata(item: any): Promise<any> {
    let preview = (await getLinkPreview(item.url)) as any;
    let data = {
      title: preview.title,
      description: preview.description,
      image: preview.images[0],
    };

    switch (preview.siteName) {
      case 'GitHub': {
        const [repo, description] = preview.title
          .replace('GitHub - ', '')
          .split(':');
        const [author, title] = repo.split('/');

        Object.assign(data, {
          ...data,
          title: item.category === 'packages' ? title : repo,
          description,
          author,
        });
        break;
      }
      case 'YouTube': {
        Object.assign(data, {
          ...data,
          video: `https://www.youtube.com/embed/${new URL(
            item.url
          ).searchParams.get('v')}`,
        });
        break;
      }
    }

    return {
      ...data,
      ...item,
    };
  }

  function createSearchEntries(items: any[]) {
    const index = Fuse.createIndex(keys, items).toJSON();

    return [
      { key: 'index', value: JSON.stringify(index) },
      { key: 'list', value: JSON.stringify(items) },
    ];
  }

  function createMetaEntries(items: any[]) {
    const orders = ['articles', 'videos', 'packages', 'templates', 'examples'];
    const categories = [...new Set(items.map((item) => item.category))].sort(
      (prev, next) => orders.indexOf(prev) - orders.indexOf(next)
    );
    const platforms = [...new Set(items.flatMap((item) => item.platforms))];
    const versions = [...new Set(items.flatMap((item) => item.remixVersions))];

    return [
      { key: 'category', value: JSON.stringify(categories) },
      { key: 'platform', value: JSON.stringify(platforms) },
      { key: 'version', value: JSON.stringify(versions) },
    ];
  }

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
      meta: createMetaEntries(items),
      search: createSearchEntries(items),
    };
  };
};
