import type { Env, UserProfile } from './types';
import { createEntry, getMetadata } from './preview';

/**
 * EntriesStore - A durable object that keeps entries data and preview info
 */
export class EntriesStore {
  state: DurableObjectState;
  env: Env;
  entryIdByURL: Record<string, string | null>;

  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get('entryIdByURL');
      this.entryIdByURL = stored || {};
    });
  }

  async fetch(request: Request) {
    try {
      let url = new URL(request.url);
      let method = request.method.toUpperCase();

      if (method === 'POST') {
        switch (url.pathname) {
          case '/submit': {
            const formData = await request.formData();
            const url = formData.get('url');
            const id = await this.createEntry(url);
            const body = new URLSearchParams({ id });

            return new Response(body, { status: 201 });
          }
        }
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.log(
        `Entries failed while handling a fetch call - ${request.url}; Received message: ${e.message}`
      );

      return new Response('Internal Server Error', { status: 500 });
    }
  }

  async createEntry(url: string) {
    let id = this.entryIdByURL[url] ?? null;

    if (!id) {
      const entry = await createEntry(url);

      if (url !== entry.url) {
        id = await this.createEntry(entry.url);
      }

      if (!id) {
        id = entry.id;

        this.state.storage.put(id, entry);
        this.env.CONTENT.put(`entry/${id}`, JSON.stringify(entry), {
          metadata: getMetadata(entry),
        });
      }

      this.entryIdByURL[url] = id;
      this.state.storage.put('entryIdByURL', this.entryIdByURL);
    }

    return id;
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
    console.log('UserStore:fetch', request);
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

          const formData = await request.formData();
          const userId = formData.get('userId');
          const entryId = formData.get('entryId');

          if (this.profile.id !== userId) {
            throw new Error(
              'View failed; Please ensure the request is sent to the proper DO'
            );
          }

          this.viewed = this.viewed.filter((id) => id !== entryId).unshift(id);
          this.state.storage.put('viewed', this.viewed);

          return new Response('OK', { status: 200 });
        }
        case '/bookmark': {
          if (method !== 'PUT' && method !== 'DELETE') {
            break;
          }

          const formData = await request.formData();
          const userId = formData.get('userId');
          const entryId = formData.get('entryId');

          if (this.profile.id !== userId) {
            throw new Error(
              'Bookmark failed; Please ensure the request is sent to the proper DO'
            );
          }

          this.bookmarked = this.bookmarked.filter((id) => id !== entryId);

          if (method === 'PUT') {
            this.bookmarked.unshift(id);
          }

          this.state.storage.put('bookmarked', this.bookmarked);

          return new Response('OK', { status: 200 });
        }
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.log(
        `Entries failed while handling a fetch call - ${request.url}; Received message: ${e.message}`
      );

      return new Response('Internal Server Error', { status: 500 });
    }
  }
}
