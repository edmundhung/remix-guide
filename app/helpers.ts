export function notFound(): Response {
  const statusText = 'Not Found';

  return new Response(statusText, { status: '404', statusText });
}

export function capitalize(text: string | undefined): string {
  if (!text) {
    return '';
  }

  return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

export function noOp() {
  // do nothing
}
