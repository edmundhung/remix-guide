export function notFound(): Response {
  const statusText = 'Not Found';

  return new Response(statusText, { status: 404, statusText });
}

export function formatMeta({
  title,
  description,
  ...meta
}: Record<string, string>) {
  const descriptor = {
    title: title !== 'Remix Guide' ? `${title} - Remix Guide` : title,
    'og:title': title,
    'twitter:title': title,
    'og:site_name': 'remix-guide',
    'og:type': 'website',
    ...meta,
  };

  if (description) {
    descriptor['description'] = description;
    descriptor['og:description'] = description;
    descriptor['twitter:description'] = description;
  }

  return descriptor;
}

export function capitalize(text: string | undefined): string | null {
  if (!text) {
    return null;
  }

  return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

export function throttle(callback, limit) {
  let lastArgs = [];
  let waiting = false;

  return function () {
    lastArgs = Array.from(arguments);

    if (!waiting) {
      waiting = true;
      setTimeout(function () {
        waiting = false;
        callback(...lastArgs);
      }, limit);
    }
  };
}
