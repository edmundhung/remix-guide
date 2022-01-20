import { Category } from '~/types';

export const categories: Category[] = [
	'tutorials',
	'packages',
	'examples',
	'others',
];

export const platforms = [
	'aws',
	'azure',
	'cloudflare',
	'firebase',
	'fly',
	'netlify',
	'render',
	'vercel',
];

export const integrations = [
	'architect',
	'cypress',
	'express',
	'prisma',
	'tailwindcss',
];

export const administrators = ['edmundhung'];

export const maintainers = administrators.concat(
	'marbiano',
	'CanRau',
	'ryanflorence',
	'mjackson',
	'kentcdodds',
	'jacob-ebey',
	'mcansh',
	'kiliman',
	'benborgers',
);
