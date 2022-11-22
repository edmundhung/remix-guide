import type { LoaderArgs } from '@remix-run/cloudflare';
import { capitalize } from '~/helpers';
import { search } from '~/resources';
import { getSearchOptions } from '~/search';

interface FeedEntry {
	title: string;
	pubDate: string;
	link: string;
	guid: string;
}

export async function loader({ request, context }: LoaderArgs) {
	const url = new URL(request.url);
	const searchOptions = getSearchOptions(request.url);
	const resources = await context.resourceStore.list();
	const list = search(resources, {
		...searchOptions,
		sort: 'new',
		limit: 25,
	});
	const entries = list.entries.reduce<FeedEntry[]>((list, resource) => {
		if (resource.title) {
			list.push({
				title:
					!searchOptions.list && resource.lists
						? `[${resource.lists.map((list) => capitalize(list)).join(', ')}] ${
								resource.title
						  }`
						: resource.title,
				pubDate: new Date(resource.createdAt).toUTCString(),
				link: resource.url,
				guid: `${url.origin}/resources/${resource.id}`,
			});
		}

		return list;
	}, []);

	const rss = `
        <?xml version="1.0" encoding="utf-8"?>
        <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
            <channel>
                <title>Remix Guide</title>
                <description>A platform for the Remix community</description>
                <link>${url.origin}</link>
                <language>en-us</language>
				<generator>remix-guide</generator>
                <ttl>60</ttl>
                <atom:link href="${
									url.origin
								}/rss.xml" rel="self" type="application/rss+xml" />
                ${entries
									.map((entry) =>
										`
					<item>
						<title><![CDATA[${entry.title}]]></title>
						<pubDate>${entry.pubDate}</pubDate>
						<link>${entry.link}</link>
						<guid>${entry.guid}</guid>
					</item>
				`.trim(),
									)
									.join('\n')}
            </channel>
        </rss>
    `.trim();

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/xml',
			'Content-Length': String(new TextEncoder().encode(rss).length),
		},
	});
}
