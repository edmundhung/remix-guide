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
    { name: 'platforms', weight: 2 },
    { name: 'packages', weight: 1 },
  ];

  // async function getRemixMetadata() {
  //   const response = await fetch('https://registry.npmjs.org/remix');
  //   const data = await response.json();
  //   const { latest } = data['dist-tags'];
  //   const time = Object.fromEntries(
  //     Object
  //       .entries(data.time)
  //       .filter(([version, time]) => semvar.valid(version) && semvar.gt(version, '0.17.0'))
  //   );
  //   const versions = Array.from(new Set(Object.keys(time).map(version => `${semvar.major(version)}.${semvar.minor(version)}`)));

  //   return {
  //     time,
  //     latest,
  //     versions,
  //   };
  // }

  async function previewMetadata(source: any): Promise<any> {
    let preview = (await getLinkPreview(source.url)) as any;
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
          title: source.category === 'packages' ? title : repo,
          description,
          author,
        });
        break;
      }
      case 'Gist': {
        const [author] = source.url
          .replace('https://gist.github.com/', '')
          .split('/');

        Object.assign(data, {
          ...data,
          author,
          description: '',
        });
        break;
      }
      case 'YouTube': {
        Object.assign(data, {
          ...data,
          video: `https://www.youtube.com/embed/${new URL(
            source.url
          ).searchParams.get('v')}`,
        });
        break;
      }
    }

    return {
      ...data,
      ...source, // Source data always takes priority
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
    // const remix = await getRemixMetadata();
    const orders = ['articles', 'videos', 'packages', 'templates', 'examples'];
    const categories = [...new Set(items.map((item) => item.category))]
      .filter((v) => !!v)
      .sort((prev, next) => orders.indexOf(prev) - orders.indexOf(next));
    const platforms = [
      ...new Set(items.flatMap((item) => item.platforms)),
    ].filter((v) => !!v);
    const languages = [
      ...new Set(items.flatMap((item) => item.language)),
    ].filter((v) => !!v);
    const versions = [...new Set(items.map((item) => item.version))].filter(
      (v) => !!v
    );

    return [
      {
        key: 'data',
        value: JSON.stringify({ categories, platforms, versions, languages }),
      },
      // { key: 'remix', value: JSON.stringify(remix) },
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
