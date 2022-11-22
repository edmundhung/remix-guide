import { type EntryContext } from '@remix-run/cloudflare';
import { RemixServer } from '@remix-run/react';
import isbot from 'isbot';
import { renderToReadableStream } from 'react-dom/server';

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	remixContext: EntryContext,
) {
	const body = await renderToReadableStream(
		<RemixServer context={remixContext} url={request.url} />,
		{
			onError: (error) => {
				responseStatusCode = 500;
				console.error(error);
			},
			signal: request.signal,
		},
	);

	if (isbot(request.headers.get('User-Agent'))) {
		await body.allReady;
	}

	const headers = new Headers(responseHeaders);
	headers.set('Content-Type', 'text/html');

	return new Response(body, {
		status: responseStatusCode,
		headers,
	});
}
