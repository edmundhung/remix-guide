import type { LoaderArgs } from '@remix-run/cloudflare';
import { search } from '~/resources';

interface FeedEntry {
	title: string;
	description: string | null | undefined;
	pubDate: string;
	guid: string;
}

export async function loader({ context }: LoaderArgs) {
	const domain = 'https://remix.guide';
	const resources = await context.resourceStore.list();
	const list = search(resources, {
		limit: 25,
		sort: 'new',
	});

	const entries = list.entries.map<FeedEntry>((resource) => ({
		title: resource.title ?? '',
		description: resource.description,
		pubDate: new Date(resource.createdAt).toUTCString(),
		guid: `${domain}/resources/${resource.id}`,
	}));

	const rss = `
        <?xml version="1.0" encoding="utf-8"?>
        <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
            <channel>
                <title>Remix Guide</title>
                <description>A platform for the Remix community</description>
                <link>https://remix.guide</link>
                <language>en-us</language>
				<generator>remix-guide</generator>
                <ttl>60</ttl>
                <atom:link href="https://remix.guide/rss.xml" rel="self" type="application/rss+xml" />
                ${entries
									.map((entry) =>
										`
					<item>
						<title><![CDATA[${entry.title}]]></title>
						<description><![CDATA[${entry.description}]]></description>
						<pubDate>${entry.pubDate}</pubDate>
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
