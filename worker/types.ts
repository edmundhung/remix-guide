import type { Tracker } from 'workers-logger';
export type { Context } from './context';

export type AsyncReturnType<T> = T extends Promise<infer U>
	? U
	: T extends (...args: any) => Promise<infer U>
	? U
	: T extends (...args: any) => infer U
	? U
	: T;

export interface Env {
	GITHUB_TOKEN?: string;
	GITHUB_CLIENT_ID?: string;
	GITHUB_CLIENT_SECRET?: string;
	GITHUB_CALLBACK_URL?: string;
	GOOGLE_API_KEY?: string;
	SESSION_SECRETS?: string;
	SENTRY_DSN?: string;
	USER_AGENT?: string;
	DEBUG?: string;
	CONTENT: KVNamespace;
	RESOURCES_STORE: DurableObjectNamespace;
	PAGE_STORE: DurableObjectNamespace;
	USER_STORE: DurableObjectNamespace;
}

export interface UserProfile {
	id: string;
	name: string;
	email: string;
}

export interface User {
	profile: UserProfile;
	viewed: string[];
	bookmarked: string[];
}

export type Category = 'package' | 'repository' | 'others';

export interface Page {
	url: string;
	author?: string;
	category?: string;
	title?: string | null;
	description?: string | null;
	dependencies?: Record<string, string>;
	configs?: string[];
	image?: string | null;
	video?: string | null;
	isSafe?: boolean;
	viewCount?: number;
	bookmarkUsers?: string[];
	createdAt: string;
	updatedAt: string;
}

export interface PageMetadata
	extends Pick<
		Page,
		| 'url'
		| 'title'
		| 'description'
		| 'category'
		| 'isSafe'
		| 'createdAt'
		| 'updatedAt'
	> {
	viewCount: number;
	bookmarkCount: number;
}

export type SubmissionStatus = 'PUBLISHED' | 'RESUBMITTED' | 'INVALID';

export type MessageType = 'success' | 'error' | 'warning' | 'info';

export interface ResourceSummary {
	id: string;
	url: string;
	createdAt: string;
	createdBy: string;
	updatedAt: string;
	updatedBy: string;
}

export interface Resource extends Page, ResourceSummary {
	integrations: string[];
}

export interface SearchOptions {
	keyword?: string | null;
	list?: string | null;
	guide?: string | null;
	author?: string | null;
	site?: string | null;
	category?: Category | null;
	platform?: string | null;
	integrations?: string[] | null;
	includes?: string[] | null;
	excludes?: string[] | null;
	limit?: number;
	sort?: string | null;
}
