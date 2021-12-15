export function notFound(): Response {
  const statusText = 'Not Found';

  return new Response(statusText, { status: 404, statusText });
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
