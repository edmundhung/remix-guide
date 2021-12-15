import { customAlphabet } from 'nanoid';
import type { Entry, Env, Metadata, UserProfile, User, Page } from '../types';
import { scrapeUrl, isSupportedSite, getAdditionalMetadata } from './preview';

/**
 * ID Generator based on nanoid
 * Using alphabets and digits only
 */
const generateId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
);

/**
 * EntriesStore - A durable object that keeps entries data and preview info
 */
export class EntriesStore {
  state: DurableObjectState;
  env: Env;
  entryIdByURL: Record<string, string | null>;
  scheduledEntryIds: string[];

  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.scheduledEntryIds = [];
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get('entryIdByURL');
      this.entryIdByURL = stored || {};
    });
  }

  async fetch(request: Request) {
    try {
      let url = new URL(request.url);
      let method = request.method.toUpperCase();

      switch (url.pathname) {
        case '/submit': {
          if (method !== 'POST') {
            break;
          }

          const { url, category, userId } = await request.json();

          let message = null;
          let id = this.entryIdByURL[url] ?? null;

          if (!id) {
            const page = await scrapeUrl(url);

            if (url !== page.url) {
              id = this.entryIdByURL[page.url] ?? null;
              message = 'The provided URL is already submitted previously';
            }

            if (!id) {
              let result = await this.createEntry(page, category, userId);

              id = result.id;
              message = result.message;
              this.entryIdByURL[page.url] = id;
            }

            this.entryIdByURL[url] = id;
            this.state.storage.put('entryIdByURL', this.entryIdByURL);
          } else {
            message = 'The provided URL is already submitted previously';
          }

          const body = JSON.stringify({ id, message });

          return new Response(body, { status: 201 });
        }
        case '/update': {
          if (method !== 'POST') {
            break;
          }

          const entryIds = this.scheduledEntryIds.splice(
            0,
            this.scheduledEntryIds.length
          );
          const entryById = await this.state.storage.get<Entry>(entryIds);
          const entries = Array.from(entryById.values());
          const result = await Promise.allSettled(
            entries.map(async (entry) => {
              const page = await this.loadPage(entry.url);

              await this.updateEntry({
                ...entry,
                ...page,
              });

              return entry.id;
            })
          );

          const failedEntryIds = result.reduce(
            (list, r) => {
              if (r.status === 'rejected') {
                return list;
              }

              return list.filter((id) => id !== r.value);
            },
            [...entryIds]
          );

          if (failedEntryIds.length > 0) {
            this.scheduledEntryIds.push(...failedEntryIds);
          }

          return new Response('OK', { status: 200 });
        }
        case '/refresh': {
          if (method !== 'POST') {
            break;
          }

          const { entryId } = await request.json();
          const entry = await this.getEntry(entryId);

          if (!entry) {
            return new Response('Not Found', { status: 404 });
          }

          this.scheduledEntryIds.push(entryId);

          return new Response('OK', { status: 202 });
        }
        case '/view': {
          if (method !== 'PUT') {
            break;
          }

          const { entryId } = await request.json();
          const entry = await this.getEntry(entryId);

          if (!entry) {
            return new Response('Not Found', { status: 404 });
          }

          this.updateEntry({
            ...entry,
            viewCounts: (entry.viewCounts ?? 0) + 1,
          });

          return new Response('OK', { status: 200 });
        }
        case '/bookmark': {
          if (method !== 'PUT' && method !== 'DELETE') {
            break;
          }

          const { entryId } = await request.json();
          const entry = await this.getEntry(entryId);

          if (!entry) {
            return new Response('Not Found', { status: 404 });
          }

          this.updateEntry({
            ...entry,
            bookmarkCounts:
              (entry.bookmarkCounts ?? 0) + (method === 'PUT' ? 1 : -1),
          });

          return new Response('OK', { status: 200 });
        }
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.log(
        `EntriesStore failed while handling fetch - ${request.url}; Received message: ${e.message}`
      );

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  async createEntry(page: Page, category: string, userId: string) {
    if (!isSupportedSite(page, category)) {
      return {
        id: null,
        message:
          'The provided URL does not match the choosen category; Pleae refine your selection and submit again',
      };
    }

    const id = generateId();
    const now = new Date().toISOString();
    const data = await getAdditionalMetadata(page, this.env);

    this.updateEntry({
      ...data,
      id,
      category,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    });

    return {
      id,
      message: 'Resourced created',
    };
  }

  async getEntry(entryId: string) {
    const entry = await this.state.storage.get<Entry>(entryId);

    if (!entry) {
      return null;
    }

    return entry;
  }

  async updateEntry(entry: Entry) {
    const metadata: Metadata = {
      id: entry.id,
      url: entry.url,
      category: entry.category,
      author: entry.author,
      title: entry.title,
      description: entry.description,
      integrations: Array.from(
        Object.keys(entry.dependencies ?? {}).reduce((result, packageName) => {
          switch (packageName) {
            case 'cypress':
            case 'tailwindcss':
            case 'prisma':
              result.add(packageName);
              break;
            case '@remix-run/architect':
              result.add('architect');
              break;
            case '@azure/functions':
              result.add('azure');
              break;
            case '@remix-run/cloudflare-workers':
            case '@cloudflare/workers-types':
            case '@cloudflare/wrangler':
              result.add('cloudflare');
              break;
            case 'express':
            case '@remix-run/express':
              result.add('express');
              break;
            case 'firebase':
            case 'firebase-admin':
              result.add('firebase');
              break;
            case '@remix-run/netlify':
              result.add('netlify');
              break;
            case 'vercel':
            case '@vercel/node':
            case '@remix-run/vercel':
              result.add('vercel');
              break;
          }

          return result;
        }, new Set<string>())
      ),
      viewCounts: entry.viewCounts,
      bookmarkCounts: entry.bookmarkCounts,
      createdAt: entry.createdAt,
    };

    this.state.storage.put(entry.id, entry);
    this.env.CONTENT.put(`entry/${entry.id}`, JSON.stringify(entry), {
      metadata,
    });
  }
}

/**
 * UserStore - A durable object that keeps user profile, bookmarks and views
 */
export class UserStore {
  state: DurableObjectState;
  env: Env;
  profile: UserProfile;
  bookmarked: string[];
  viewed: string[];

  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      let profile = await this.state.storage.get('profile');
      let bookmarked = await this.state.storage.get('bookmarked');
      let viewed = await this.state.storage.get('viewed');

      this.profile = profile ?? null;
      this.bookmarked = bookmarked ?? [];
      this.viewed = viewed ?? [];
    });
  }

  async fetch(request: Request) {
    try {
      let url = new URL(request.url);
      let method = request.method.toUpperCase();

      switch (url.pathname) {
        case '/profile': {
          if (method !== 'PUT') {
            break;
          }

          const profile = await request.json();

          if (this.profile !== null && this.profile.id !== profile.id) {
            throw new Error(
              'The user store is already registered with a different userId'
            );
          }

          this.profile = profile;
          this.state.storage.put('profile', this.profile);

          return new Response('OK', { status: 200 });
        }
        case '/view': {
          if (method !== 'PUT') {
            break;
          }

          const { userId, entryId } = await request.json();

          if (this.profile.id !== userId) {
            throw new Error(
              'View failed; Please ensure the request is sent to the proper DO'
            );
          }

          this.viewed = this.viewed.filter((id) => id !== entryId);
          this.viewed.unshift(entryId);
          this.state.storage.put('viewed', this.viewed);
          this.updateUserCache();

          return new Response('OK', { status: 200 });
        }
        case '/bookmark': {
          if (method !== 'PUT' && method !== 'DELETE') {
            break;
          }

          const { userId, entryId } = await request.json();

          if (this.profile.id !== userId) {
            throw new Error(
              'Bookmark failed; Please ensure the request is sent to the proper DO'
            );
          }

          this.bookmarked = this.bookmarked.filter((id) => id !== entryId);

          if (method === 'PUT') {
            this.bookmarked.unshift(entryId);
          }

          this.state.storage.put('bookmarked', this.bookmarked);
          this.updateUserCache();

          return new Response('OK', { status: 200 });
        }
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.log(
        `UserStore failed while handling a fetch call - ${request.url}; Received message: ${e.message}`
      );

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  async updateUserCache() {
    const user: User = {
      profile: this.profile,
      viewed: this.viewed,
      bookmarked: this.bookmarked,
    };

    await this.env.CONTENT.put(
      `user/${user.profile.id}`,
      JSON.stringify(user),
      { metadata: user.profile }
    );
  }
}
