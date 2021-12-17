import { customAlphabet } from 'nanoid';
import type {
  Entry,
  Env,
  UserProfile,
  User,
  Page,
  SubmissionStatus,
} from '../types';
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
  entryIdByPackageName: Record<string, string | null>;
  scheduledEntryIds: string[];

  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.scheduledEntryIds = [];
    this.state.blockConcurrencyWhile(async () => {
      let entryIdByURL = await this.state.storage.get('index/URL');
      let entryIdByPackageName = await this.state.storage.get(
        'index/PackageName'
      );
      this.entryIdByURL = entryIdByURL ?? {};
      this.entryIdByPackageName = entryIdByPackageName ?? {};
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

          let entry: Entry | null = null;
          let status: SubmissionStatus | null = null;
          let id = this.entryIdByURL[url] ?? null;

          if (!id) {
            const page = await scrapeUrl(url);

            if (url !== page.url) {
              id = this.entryIdByURL[page.url] ?? null;
              status = 'RESUBMITTED';
            }

            if (!id) {
              const result = await this.createEntry(page, category, userId);

              id = result.id;
              status = result.status;
              entry = result.entry;
              this.entryIdByURL[page.url] = id;
            }

            if (entry && entry.category === 'packages') {
              this.entryIdByPackageName[entry.title] = entry.id;
              this.state.storage.put(
                'index/PackageName',
                this.entryIdByPackageName
              );
            }

            this.entryIdByURL[url] = id;
            this.state.storage.put('index/URL', this.entryIdByURL);
          } else {
            status = 'RESUBMITTED';
          }

          const body = JSON.stringify({ id, entry, status });

          return new Response(body, { status: 201 });
        }
        // case '/update': {
        //   if (method !== 'POST') {
        //     break;
        //   }

        //   const entryIds = this.scheduledEntryIds.splice(
        //     0,
        //     this.scheduledEntryIds.length
        //   );
        //   const entryById = await this.state.storage.get<Entry>(entryIds);
        //   const entries = Array.from(entryById.values());
        //   const result = await Promise.allSettled(
        //     entries.map(async (entry) => {
        //       const page = await this.loadPage(entry.url);

        //       await this.updateEntry({
        //         ...entry,
        //         ...page,
        //       });

        //       return entry.id;
        //     })
        //   );

        //   const failedEntryIds = result.reduce(
        //     (list, r) => {
        //       if (r.status === 'rejected') {
        //         return list;
        //       }

        //       return list.filter((id) => id !== r.value);
        //     },
        //     [...entryIds]
        //   );

        //   if (failedEntryIds.length > 0) {
        //     this.scheduledEntryIds.push(...failedEntryIds);
        //   }

        //   return new Response('OK', { status: 200 });
        // }
        // case '/refresh': {
        //   if (method !== 'POST') {
        //     break;
        //   }

        //   const { entryId } = await request.json();
        //   const entry = await this.getEntry(entryId);

        //   if (!entry) {
        //     return new Response('Not Found', { status: 404 });
        //   }

        //   this.scheduledEntryIds.push(entryId);

        //   return new Response('OK', { status: 202 });
        // }
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

          const bookmarkCounts =
            (entry.bookmarkCounts ?? 0) + (method === 'PUT' ? 1 : -1);

          const updated = await this.updateEntry({
            ...entry,
            bookmarkCounts: bookmarkCounts > 0 ? bookmarkCounts : 0,
          });
          const body = JSON.stringify({ entry: updated });

          return new Response(body, { status: 200 });
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

  async createEntry(
    page: Page,
    category: string,
    userId: string
  ): Promise<{
    id: string | null;
    entry: Entry | null;
    status: SubmissionStatus;
  }> {
    if (!isSupportedSite(page, category)) {
      return {
        id: null,
        entry: null,
        status: 'INVALID_CATEGORY',
      };
    }

    const id = generateId();
    const now = new Date().toISOString();
    const data = await getAdditionalMetadata(
      page,
      Object.keys(this.entryIdByPackageName),
      this.env
    );
    const entry = await this.updateEntry({
      ...data,
      id,
      category,
      createdAt: now,
      createdBy: userId,
    });

    return {
      id,
      entry,
      status: 'PUBLISHED',
    };
  }

  async getEntry(entryId: string) {
    const entry = await this.state.storage.get<Entry>(entryId);

    if (!entry) {
      return null;
    }

    return entry;
  }

  async updateEntry(entry: Entry): Promise<Entry> {
    await this.state.storage.put(entry.id, entry);

    return entry;
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
        case '/': {
          if (method !== 'GET') {
            break;
          }

          const user: User = {
            profile: this.profile,
            viewed: this.viewed,
            bookmarked: this.bookmarked,
          };
          const body = JSON.stringify({ user });

          return new Response(body, { status: 200 });
        }
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
          this.state.storage.put('profile', profile);
          this.env.CONTENT.put(`user/${profile.id}`, JSON.stringify(profile), {
            metadata: profile,
          });

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

          const isBookmarked = this.bookmarked.includes(entryId);

          if (
            (method === 'PUT' && isBookmarked) ||
            (method === 'DELETE' && !isBookmarked)
          ) {
            return new Response('Conflict', { status: 409 });
          }

          if (method === 'PUT') {
            this.bookmarked.unshift(entryId);
          } else {
            this.bookmarked = this.bookmarked.filter((id) => id !== entryId);
          }

          this.state.storage.put('bookmarked', this.bookmarked);

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
}
