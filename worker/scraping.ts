import { decode } from 'html-entities';
import { integrations, platforms } from '~/config';
import type { Category, Env, Page } from './types';

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

async function scrapeHTML(url: string, userAgent: string): Promise<Page> {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html',
      'User-Agent': userAgent, //'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    const { hostname, pathname } = new URL(url);

    /**
     * Bypassing it manually if the request fails
     */
    switch (hostname) {
      case 'www.youtube.com':
        return {
          siteName: 'YouTube',
          url,
        };
      case 'youtu.be':
        return {
          siteName: 'YouTube',
          url: `https://www.youtube.com/watch?v=${pathname.slice(1)}`,
        };
    }

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
    siteName: createAttributeParser('meta[property="og:site_name"]', 'content'),
    url: mergeParsers(
      createAttributeParser('link[rel="canonical"]', 'href'),
      createAttributeParser('meta[property="og:url"]', 'content')
    ),
  });

  return {
    ...page,
    url: page.url ?? url,
  };
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

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

async function getYouTubeMetadata(videoId: string, apiKey: string) {
  const response = await fetch(
    `https://youtube.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`
  );

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

function getIntegrations(
  files: string[],
  packages: string[],
  dependencies: Record<string, string>
): string[] {
  let integrations = new Set<string>();

  for (const packageName of Object.keys(dependencies)) {
    if (packageName === 'remix' || packageName.startsWith('@remix-run/')) {
      integrations.add('remix');
    }

    if (
      packages
        .concat(['cypress', 'tailwindcss', 'prisma', 'express'])
        .includes(packageName)
    ) {
      integrations.add(packageName);
    }

    switch (packageName) {
      case '@remix-run/architect':
        integrations.add('architect');
        break;
      case '@azure/functions':
        integrations.add('azure');
        break;
      case '@remix-run/cloudflare-workers':
      case '@remix-run/cloudflare-pages':
      case '@cloudflare/workers-types':
      case '@cloudflare/wrangler':
        integrations.add('cloudflare');
        break;
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

  for (const file of files) {
    switch (file.name) {
      case 'wrangler.toml':
        integrations.add('cloudflare');
        break;
      case 'fly.toml':
        integrations.add('fly');
        break;
      case 'netlify.toml':
        integrations.add('netlify');
        break;
      case 'vercel.json':
        integrations.add('vercel');
        break;
      case 'firebase.json':
      case '.firebaserc':
        integrations.add('firebase');
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

  const packageJSON = files.find((file) => file.name === 'package.json')
    ? await getGithubRepositoryPackacgeJSON(repo, metadata['default_branch'])
    : null;

  return {
    title: metadata['full_name'],
    description: metadata['description'],
    author: metadata['owner']?.['login'],
    integrations: getIntegrations(files, packages, {
      ...packageJSON?.dependencies,
      ...packageJSON?.devDependencies,
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

async function parseYouTubeVideo(videoId: string, apiKey: string) {
  const metadata = await getYouTubeMetadata(videoId, apiKey);

  if (!metadata) {
    return null;
  }

  const [video] = metadata.items;
  const { thumbnails } = video.snippet;

  return {
    title: video.snippet.title,
    description: video.snippet.description,
    image:
      thumbnails.standard?.url ??
      thumbnails.high?.url ??
      thumbnails.medium?.url ??
      null,
    video: `https://www.youtube.com/embed/${videoId}`,
  };
}

function isValidResource(page: Page, category: Category): boolean {
  switch (category) {
    case 'tutorials':
      return (
        !['npm', 'GitHub'].includes(page.siteName) &&
        (page.title?.toLowerCase().includes('remix') ||
          page.description?.toLowerCase().includes('remix'))
      );
    case 'packages':
      return (
        page.siteName === 'npm' && page.title?.toLowerCase().includes('remix')
      );
    case 'examples':
      return (
        page.siteName === 'GitHub' &&
        page.integrations
          ?.map((option) => option.toLowerCase())
          .includes('remix')
      );
    case 'others':
      return true;
  }
}

function getIntegrationsFromPage(page: Page, packages: string[]): string[] {
  const result = new Set<string>();
  const tokens = []
    .concat(page.title ?? [], page.description ?? [])
    .join(' ')
    .toLowerCase()
    .match(/[a-z-0-9]+/gi);

  if (tokens) {
    for (const keyword of [...packages, ...integrations, ...platforms]) {
      if (tokens.includes(keyword)) {
        result.add(keyword);
      }
    }
  }

  return Array.from(result);
}

async function getAdditionalMetadata(
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

  let metadata: Partial<Page> | null = null;

  switch (page.siteName) {
    case 'npm': {
      metadata = await parseNpmPackage(page.title, packages, env.GITHUB_TOKEN);
      break;
    }
    case 'GitHub': {
      const [repo] = page.title.replace('GitHub - ', '').split(':');

      metadata = await parseGithubRepository(repo, packages, env.GITHUB_TOKEN);
      break;
    }
    case 'Gist': {
      const [author] = page.url
        .replace('https://gist.github.com/', '')
        .split('/');

      metadata = {
        author,
        description: '',
      };
      break;
    }
    case 'YouTube': {
      const videoId = new URL(page.url).searchParams.get('v');

      metadata = await parseYouTubeVideo(videoId, env.YOUTUBE_API_KEY);
      break;
    }
  }

  const result = {
    ...page,
    ...metadata,
  };

  if (!result.integrations) {
    result.integrations = getIntegrationsFromPage(result, packages);
  }

  return result;
}

export { scrapeHTML, getAdditionalMetadata, isValidResource };
