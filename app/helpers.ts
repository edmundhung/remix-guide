import { administrators, maintainers } from './config';

export function notFound(): Response {
	const statusText = 'Not Found';

	return new Response(statusText, { status: 404, statusText });
}

export function formatMeta(meta: Record<string, string>) {
	const descriptor: Record<string, string> = {
		title: 'Remix Guide',
		'og:site_name': 'remix-guide',
		'og:type': 'website',
	};

	for (const [key, value] of Object.entries(meta)) {
		if (!key || !value) {
			continue;
		}

		switch (key) {
			case 'title': {
				descriptor['title'] =
					value === descriptor['title']
						? descriptor['title']
						: `${value} - ${descriptor['title']}`;
				descriptor['og:title'] = value;
				descriptor['twitter:title'] = value;
				break;
			}
			case 'description': {
				descriptor['description'] = value;
				descriptor['og:description'] = value;
				descriptor['twitter:description'] = value;
				break;
			}
			default: {
				descriptor[key] = value;
				break;
			}
		}
	}

	return descriptor;
}

export function capitalize(text: string): string;
export function capitalize(text: null | undefined): null;
export function capitalize(text: string | null | undefined): string | null {
	if (!text) {
		return null;
	}

	return text[0].toUpperCase() + text.slice(1).toLowerCase();
}

export function isMaintainer(name: string | null | undefined) {
	if (!name) {
		return false;
	}

	if (process.env.NODE_ENV === 'development') {
		return true;
	}

	return maintainers.includes(name) || isAdministrator(name);
}

export function isAdministrator(name: string | null | undefined) {
	if (!name) {
		return false;
	}

	if (process.env.NODE_ENV === 'development') {
		return true;
	}

	return administrators.includes(name);
}
