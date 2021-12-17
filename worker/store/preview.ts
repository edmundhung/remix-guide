import { decode } from 'html-entities';
import type { Category, Env, Page } from '../types';

interface Parser {
  setup(htmlRewriter: HTMLRewriter): HTMLRewriter;
  getResult(): string | null;
}

function createAttributeParser(selector: string, attribute: string): Parser {
  let result: string | null = null;

  return {
    setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
      return htmlRewriter.on(selector, {
        element(element) {
          result = element.getAttribute(attribute);
        },
      });
    },
    getResult() {
      return result ? decode(result) : null;
    },
  };
}

function createTextParser(selector: string): Parser {
  let text: string | null = null;

  return {
    setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
      return htmlRewriter.on(selector, {
        text(element) {
          text = (text ?? '') + element.text;
        },
      });
    },
    getResult() {
      return text ? decode(text) : null;
    },
  };
}

function mergeParsers(...parsers: Parser[]): Parser {
  return {
    setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
      return parsers.reduce(
        (rewriter, parser) => parser.setup(rewriter),
        htmlRewriter
      );
    },
    getResult() {
      let result: string | null = null;

      for (let parser of parsers) {
        result = parser.getResult();

        if (result !== null) {
          break;
        }
      }

      return result;
    },
  };
}

async function parseResponse<T extends { [keys in string]: Parser }>(
  response: Response,
  config: T
): Record<keyof T, string | null> {
  let htmlRewriter = new HTMLRewriter();

  for (const parser of Object.values(config)) {
    htmlRewriter = parser.setup(htmlRewriter);
  }

  let res = htmlRewriter.transform(response);

  await res.arrayBuffer();

  return Object.fromEntries(
    Object.entries(config).map(([key, parser]) => [key, parser.getResult()])
  );
}

async function getMeta(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent':
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(
      `Fail scraping url - ${url}; Recevied ${response.status} ${response.statusText} response`
    );
  }

  const page = await parseResponse(response, {
    title: mergeParsers(
      createAttributeParser('meta[property="og:title"]', 'content'),
      createAttributeParser('meta[name="twitter:title"]', 'content'),
      createTextParser('head > title')
    ),
    description: mergeParsers(
      createAttributeParser('meta[property="og:description"]', 'content'),
      createAttributeParser('meta[name="twitter:description"]', 'content'),
      createAttributeParser('meta[name="description"]', 'content')
    ),
    image: mergeParsers(
      createAttributeParser('meta[property="og:image"]', 'content'),
      createAttributeParser('meta[name="twitter:image"]', 'content'),
      createAttributeParser('meta[name="image"]', 'content')
    ),
    site: createAttributeParser('meta[property="og:site_name"]', 'content'),
    url: mergeParsers(
      createAttributeParser('link[rel="canonical"]', 'href'),
      createAttributeParser('meta[property="og:url"]', 'content')
    ),
  });

  return page;
}

async function getPackageInfo(packageName: string) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

async function getGithubRepositoryMetadata(repo: string, token: string) {
  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'remix-guide',
      Authorization: `token ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

async function getGithubRepositoryFiles(
  repo: string,
  token: string,
  path = ''
) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contents/${path}`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'remix-guide',
        Authorization: `token ${token}`,
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

async function getGithubRepositoryPackacgeJSON(repo: string, branch: string) {
  const response = await fetch(
    `https://raw.githubusercontent.com/${repo}/${branch}/package.json`
  );
  const packageJSON = await response.json();

  return packageJSON;
}

async function getYouTubeMetadata(videoId: string, apiKey: string) {
  const response = await fetch(
    `https://youtube.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
  );
  const metadata = await response.json();

  return metadata;
}

function getIntegrations(
  files: string[],
  packages: string[],
  dependencies: Record<string, string>
): string[] {
  let integrations = new Set<string>();

  for (const packageName of Object.keys(dependencies)) {
    if (packages.includes(packageName)) {
      integrations.add(packageName);
    } else {
      switch (packageName) {
        case 'cypress':
        case 'tailwindcss':
        case 'prisma':
          integrations.add(packageName);
          break;
        case '@remix-run/architect':
          integrations.add('architect');
          break;
        case '@azure/functions':
          integrations.add('azure');
          break;
        case '@remix-run/cloudflare-workers':
        case '@cloudflare/workers-types':
        case '@cloudflare/wrangler':
          integrations.add('cloudflare');
          break;
        case 'express':
        case '@remix-run/express':
          integrations.add('express');
          break;
        case 'firebase':
        case 'firebase-admin':
          integrations.add('firebase');
          break;
        case '@remix-run/netlify':
          integrations.add('netlify');
          break;
        case 'vercel':
        case '@vercel/node':
        case '@remix-run/vercel':
          integrations.add('vercel');
          break;
      }
    }
  }

  for (const file of files) {
    switch (file.name) {
      case 'wrangler.toml':
        integrations.add('cloudflare');
        break;
    }
  }

  return Array.from(integrations);
}

async function parseGithubRepository(
  repo: string,
  packages: string[],
  token: string
): Partial<Page> | null {
  const [metadata, files] = await Promise.all([
    getGithubRepositoryMetadata(repo, token),
    getGithubRepositoryFiles(repo, token),
  ]);

  if (!metadata) {
    return null;
  }

  const packageJSON = await getGithubRepositoryPackacgeJSON(
    repo,
    metadata['default_branch']
  );

  return {
    title: metadata['full_name'],
    description: metadata['description'],
    author: metadata['owner']?.['login'],
    integrations: getIntegrations(files, packages, {
      ...packageJSON.dependencies,
      ...packageJSON.devDependencies,
    }),
  };
}

async function parseNpmPackage(
  packageName: string,
  packages: string[],
  githubToken: string
): Partial<Page> {
  const info = await getPackageInfo(packageName);

  if (!info) {
    return null;
  }

  const repoUrl =
    info['repository']?.type === 'git'
      ? new URL(
          info['repository'].url.replace(/^git\+/, '').replace(/\.git$/, '')
        )
      : null;
  const details = repoUrl
    ? await parseGithubRepository(
        repoUrl.pathname.slice(1),
        packages,
        githubToken
      )
    : null;

  return {
    ...details,
    title: info.name,
    description: info.description,
  };
}

export async function parseYouTubeVideo(videoId: string, apiKey: string) {
  const metadata = await getYouTubeMetadata(videoId, apiKey);

  if (!metadata) {
    return null;
  }

  const [video] = metadata.items;

  return {
    title: video.snippet.title,
    description: video.snippet.description,
    image: video.snippet.thumbnails.standard.url,
    video: `https://www.youtube.com/embed/${videoId}`,
  };
}

export async function scrapeUrl(url: string): Promise<Page> {
  const meta = await getMeta(url);

  return {
    ...meta,
    url: meta.url ?? url,
  };
}

export function isSupportedSite(page: Page, category: Category): boolean {
  let supportedSites: string[] | null = null;

  switch (category) {
    case 'packages':
      supportedSites = ['npm'];
      break;
    case 'templates':
      supportedSites = ['GitHub', 'Gist'];
      break;
    case 'examples':
      supportedSites = ['GitHub'];
      break;
  }

  return supportedSites === null || supportedSites.includes(page.site);
}

export async function getAdditionalMetadata(
  page: Page,
  packages: string[],
  env: Env
): Promise<Page> {
  if (!env.GITHUB_TOKEN) {
    throw new Error(
      'Error capturing additonal metadata; GITHUB_TOKEN is not available'
    );
  }

  if (!env.YOUTUBE_API_KEY) {
    throw new Error(
      'Error capturing additonal metadata; YOUTUBE_API_KEY is not available'
    );
  }

  switch (page.site) {
    case 'npm': {
      const metadata = await parseNpmPackage(
        page.title,
        packages,
        env.GITHUB_TOKEN
      );

      return {
        ...page,
        ...metadata,
      };
    }
    case 'GitHub': {
      const [repo] = page.title.replace('GitHub - ', '').split(':');
      const metadata = await parseGithubRepository(
        repo,
        packages,
        env.GITHUB_TOKEN
      );

      return {
        ...page,
        ...metadata,
      };
    }
    case 'Gist': {
      const [author] = page.url
        .replace('https://gist.github.com/', '')
        .split('/');

      return {
        ...page,
        author,
        description: '',
      };
    }
    case 'YouTube': {
      const videoId = new URL(page.url).searchParams.get('v');
      const metadata = await parseYouTubeVideo(videoId, env.YOUTUBE_API_KEY);

      return {
        ...page,
        ...metadata,
      };
    }
  }

  return page;
}
