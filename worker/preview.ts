import { decode } from 'html-entities';

interface Parser {
  setup(htmlRewriter: HTMLRewriter): HTMLRewriter;
  getResult(): string | null;
}

function createTitleParser(): Parser {
  let ogTitle: string | null = null;
  let twitterTitle: string | null = null;
  let baseTitle: string | null = null;

  return {
    setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
      return htmlRewriter
        .on('meta[property="og:title"]', {
          element(element) {
            ogTitle = element.getAttribute('content');
          },
        })
        .on('meta[name="twitter:title"]', {
          element(element) {
            twitterTitle = element.getAttribute('content');
          },
        })
        .on('head > title', {
          text(element) {
            baseTitle = (baseTitle ?? '') + element.text;
          },
        });
    },
    getResult() {
      return ogTitle ?? twitterTitle ?? baseTitle;
    },
  };
}

function createMetaParser(name: string): Parser {
  let ogContent: string | null = null;
  let twitterContent: string | null = null;
  let baseContent: string | null = null;

  return {
    setup(htmlRewriter: HTMLRewriter): HTMLRewriter {
      return htmlRewriter
        .on(`meta[property="og:${name}"]`, {
          element(element) {
            ogContent = element.getAttribute('content');
          },
        })
        .on(`meta[name="twitter:${name}"]`, {
          element(element) {
            twitterContent = element.getAttribute('content');
          },
        })
        .on(`meta[name="${name}"]`, {
          element(element) {
            baseContent = element.getAttribute('content');
          },
        });
    },
    getResult() {
      return ogContent ?? twitterContent ?? baseContent;
    },
  };
}

function createURLParser(): Parser {
  let linkContent: string | null = null;
  let ogContent: string | null = null;

  return {
    setup(htmlRewriter) {
      return htmlRewriter
        .on('link[rel="canonical"]', {
          element(element) {
            linkContent = element.getAttribute('href');
          },
        })
        .on('meta[property="og:url"]', {
          element(element) {
            ogContent = element.getAttribute('content');
          },
        });
    },
    getResult() {
      return linkContent ?? ogContent;
    },
  };
}

function createSiteParser(): Parser {
  let ogContent: string | null = null;

  return {
    setup(htmlRewriter) {
      return htmlRewriter.on('meta[property="og:site_name"]', {
        element(element) {
          ogContent = element.getAttribute('content');
        },
      });
    },
    getResult() {
      return ogContent;
    },
  };
}

function createResponseParser<T extends { [keys in string]: Parser }>(
  config: T
) {
  let htmlRewriter = new HTMLRewriter();

  for (const parser of Object.values(config)) {
    htmlRewriter = parser.setup(htmlRewriter);
  }

  return async (response: Response): Record<keyof T, string | null> => {
    let res = htmlRewriter.transform(response);

    await res.text();

    return Object.fromEntries(
      Object.entries(config).map(([key, parser]) => {
        const result = parser.getResult();

        return [key, result ? decode(result) : null];
      })
    );
  };
}

export async function preview(url: string) {
  try {
    const response = await fetch(url);
    const parse = createResponseParser({
      title: createTitleParser(),
      description: createMetaParser('description'),
      image: createMetaParser('image'),
      site: createSiteParser(),
      url: createURLParser(),
    });
    const page = await parse(response);

    return {
      ...page,
      url: page.url ?? url,
    };
  } catch (e) {
    console.error('Error parsing response from ', url, ';Received ', e);

    return null;
  }
}
