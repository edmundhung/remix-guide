import { decode } from 'html-entities';
import { Env } from '~/types';
import type { Page } from '../types';

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
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html',
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      redirect: 'follow',
    });
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
  } catch (e) {
    console.error('Error parsing response from ', url, ';Received ', e);

    return null;
  }
}

async function getPackageInfo(packageName: string) {
  console.log(`getPackageInfo(${packageName})`);

  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const info = await response.json();

  return info;
}

async function getGithubRepositoryMetadata(repo: string, token: string) {
  console.log(`getGithubRepositoryMetadata(${repo})`);

  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'remix-guide',
      Authorization: `token ${token}`,
    },
  });
  const metadata = await response.json();

  return metadata;
}

async function getGithubRepositoryPackacgeJSON(repo: string, branch: string) {
  console.log(`getGithubRepositoryPackacgeJSON(${repo}, ${branch})`);

  const response = await fetch(
    `https://raw.githubusercontent.com/${repo}/${branch}/package.json`
  );
  const packageJSON = await response.json();

  return packageJSON;
}

async function parseGithubRepository(
  repo: string,
  token: string
): Partial<Page> {
  const metadata = await getGithubRepositoryMetadata(repo, token);
  const packageJSON = await getGithubRepositoryPackacgeJSON(
    repo,
    metadata['default_branch']
  );

  return {
    title: metadata['full_name'],
    description: metadata['description'],
    author: metadata['owner']?.['login'],
    category:
      metadata['is_template'] ||
      metadata['name']?.includes('template') ||
      metadata['description']?.includes('template')
        ? 'templates'
        : 'examples',
    dependencies: {
      ...packageJSON.dependencies,
      ...packageJSON.devDependencies,
    },
  };
}

async function parseNpmPackage(
  packageName: string,
  githubToken: string
): Partial<Page> {
  const info = await getPackageInfo(packageName);
  const repoUrl =
    info['repository']?.type === 'git'
      ? new URL(
          info['repository'].url.replace(/^git\+/, '').replace(/\.git$/, '')
        )
      : null;
  const details = repoUrl
    ? await parseGithubRepository(repoUrl.pathname.slice(1), githubToken)
    : null;

  return {
    ...details,
    title: info.name,
    description: info.description,
    category: 'packages',
  };
}

export function createPageLoader(env: Env) {
  if (!env.GITHUB_TOKEN) {
    throw new Error(
      'Error creating page loader; GITHUB_TOKEN is not available'
    );
  }

  async function loadPage(url: string): Promise<Page> {
    const meta = await getMeta(url);
    let page: Page = {
      ...meta,
      url: meta.url ?? url,
    };

    switch (page.site) {
      case 'npm': {
        page = {
          ...page,
          ...(await parseNpmPackage(page.title, env.GITHUB_TOKEN)),
        };
        break;
      }
      case 'GitHub': {
        const [repo] = page.title.replace('GitHub - ', '').split(':');

        page = {
          ...page,
          ...(await parseGithubRepository(repo, env.GITHUB_TOKEN)),
        };
        break;
      }
      case 'Gist': {
        const [author] = page.url
          .replace('https://gist.github.com/', '')
          .split('/');

        page.category = 'templates';
        page.author = author;
        page.description = '';
        break;
      }
      case 'YouTube': {
        const videoId = new URL(page.url).searchParams.get('v');

        page.video = `https://www.youtube.com/embed/${videoId}`;
        break;
      }
    }

    return page;
  }

  return loadPage;
}
