import { customAlphabet } from 'nanoid';
import { decode } from 'html-entities';
import type { Entry, Metadata } from '../types';

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

async function preview(url: string) {
  try {
    const response = await fetch(url);
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

export async function createEntry(url: string): Entry {
  const page = await preview(url);
  const generateId = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    12
  );

  let entry = {
    id: generateId(),
    url: page.url ?? url,
    title: page.title,
    description: page.description,
    image: page.image,
  };

  switch (page.site) {
    case 'GitHub': {
      const [repo, description] = entry.title
        .replace('GitHub - ', '')
        .split(':');
      const [author, title] = repo.split('/');

      entry.title = title;
      entry.description = description;
      entry.author = author;
      break;
    }
    case 'Gist': {
      const [author] = entry.url
        .replace('https://gist.github.com/', '')
        .split('/');

      entry.author = author;
      entry.description = '';
      break;
    }
    case 'YouTube': {
      const videoId = new URL(entry.url).searchParams.get('v');

      entry.video = `https://www.youtube.com/embed/${videoId}`;
      break;
    }
  }

  return entry;
}

export function getMetadata(entry: Entry): Metadata {
  return {
    id: entry.id,
    url: entry.url,
    category: entry.category,
    author: entry.author,
    title: entry.title,
    description: entry.description,
    language: entry.language,
    integrations: entry.integrations,
    viewCounts: entry.viewCounts,
    bookmarkCounts: entry.bookmarkCounts,
  };
}
