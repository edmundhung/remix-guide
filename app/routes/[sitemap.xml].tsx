import type { LoaderArgs } from '@remix-run/cloudflare';

interface SitemapEntry {
	loc: string;
	lastmod?: string;
	changefreq?:
		| 'never'
		| 'yearly'
		| 'monthly'
		| 'weekly'
		| 'daily'
		| 'hourly'
		| 'always';
	priority?: 1.0 | 0.9 | 0.8 | 0.7 | 0.6 | 0.5 | 0.4 | 0.3 | 0.2 | 0.1 | 0.0;
}

export async function loader({ context }: LoaderArgs) {
	const guide = await context.resourceStore.getData();
	const domain = 'https://remix.guide';
	const entries: SitemapEntry[] = [
		{ loc: domain, changefreq: 'hourly', priority: 1 },
	];

	for (const list of guide.metadata.lists ?? []) {
		entries.push({
			loc: `${domain}/${list.slug}`,
			changefreq: 'hourly',
			priority: 0.8,
		});
	}

	for (const [resourceId, resource] of Object.entries(guide.value)) {
		entries.push({
			loc: `${domain}/resources/${resourceId}`,
			lastmod: resource.updatedAt,
			changefreq: 'weekly',
			priority: 0.5,
		});
	}

	const sitemap = `
        <?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            ${entries
							.map((entry) =>
								`
				<url>
					<loc>${entry.loc}</loc>
					${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
					${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
					${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
				</url>
			`.trim(),
							)
							.join('\n')}
        </urlset>
    `.trim();

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Content-Length': String(new TextEncoder().encode(sitemap).length),
		},
	});
}
