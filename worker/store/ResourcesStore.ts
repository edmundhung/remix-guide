import { customAlphabet } from 'nanoid';
import { createLogger } from '../logging';
import {
  scrapeHTML,
  isValidResource,
  getAdditionalMetadata,
} from '../scraping';
import type { Resource, Env, Page, SubmissionStatus } from '../types';

/**
 * ID Generator based on nanoid
 * Using alphabets and digits only
 */
const generateId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
);

/**
 * ResourcesStore - A durable object that keeps resources data and preview info
 */
export class ResourcesStore {
  state: DurableObjectState;
  env: Env;
  resourceIdByURL: Record<string, string | null>;
  resourceIdByPackageName: Record<string, string | null>;

  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.state.blockConcurrencyWhile(async () => {
      let resourceIdByURL = await this.state.storage.get('index/URL');
      let resourceIdByPackageName = await this.state.storage.get(
        'index/PackageName'
      );
      this.resourceIdByURL = resourceIdByURL ?? {};
      this.resourceIdByPackageName = resourceIdByPackageName ?? {};
    });
  }

  async fetch(request: Request) {
    const logger = createLogger(request, {
      ...this.env,
      LOGGER_NAME: 'store:ResourcesStore',
    });

    let response: Response;

    try {
      let url = new URL(request.url);
      let method = request.method.toUpperCase();

      switch (url.pathname) {
        case '/submit': {
          if (method !== 'POST') {
            break;
          }

          const { url, category, userId } = await request.json();

          let status: SubmissionStatus | null = null;
          let id = this.resourceIdByURL[url] ?? null;

          if (!id) {
            const page = await scrapeHTML(url);

            if (url !== page.url) {
              id = this.resourceIdByURL[page.url] ?? null;
              status = 'RESUBMITTED';
            }

            if (!id) {
              const result = await this.createResource(page, category, userId);

              id = result.id;
              status = result.status;
              this.resourceIdByURL[page.url] = id;
            }

            this.resourceIdByURL[url] = id;
            this.state.storage.put('index/URL', this.resourceIdByURL);
          } else {
            status = 'RESUBMITTED';
          }

          const body = JSON.stringify({ id, status });

          response = new Response(body, { status: 201 });
          break;
        }
        case '/details': {
          if (method !== 'GET') {
            break;
          }

          const resourceId = url.searchParams.get('resourceId');
          const resource = await this.getResource(resourceId);

          if (!resource) {
            return new Response('Not Found', { status: 404 });
          }

          this.updateResourceCache(resource);

          response = new Response(JSON.stringify(resource), {
            status: 200,
          });
          break;
        }
        case '/view': {
          if (method !== 'PUT') {
            break;
          }

          const { resourceId } = await request.json();
          const resource = await this.getResource(resourceId);

          if (!resource) {
            return new Response('Not Found', { status: 404 });
          }

          this.updateResource({
            ...resource,
            viewCounts: resource.viewCounts + 1,
          });

          response = new Response('OK', { status: 200 });
          break;
        }
        case '/bookmark': {
          if (method !== 'PUT' && method !== 'DELETE') {
            break;
          }

          const { userId, resourceId } = await request.json();

          let resource = await this.getResource(resourceId);

          if (!resource) {
            return new Response('Not Found', { status: 404 });
          }

          let bookmarked = resource.bookmarked ?? [];

          switch (method) {
            case 'PUT':
              if (!bookmarked.includes(userId)) {
                bookmarked = bookmarked.concat(userId);
              }
              break;
            case 'DELETE':
              if (bookmarked.includes(userId)) {
                bookmarked = bookmarked.filter((id) => id !== userId);
              }
              break;
          }

          if (bookmarked !== resource.bookmarked) {
            this.updateResource({ ...resource, bookmarked });
          }

          response = new Response('OK', { status: 200 });
          break;
        }
      }

      if (!response) {
        response = new Response('Not found', { status: 404 });
      }
    } catch (e) {
      logger.error(e);
      logger.log(
        `ResourcesStore failed while handling fetch - ${request.url}; Received message: ${e.message}`
      );

      response = new Response('Internal Server Error', { status: 500 });
    } finally {
      logger.report(response);
    }

    return response;
  }

  async createResource(
    page: Page,
    category: string,
    userId: string
  ): Promise<{
    id: string | null;
    status: SubmissionStatus;
  }> {
    const id = generateId();
    const now = new Date().toISOString();
    const data = await getAdditionalMetadata(
      page,
      Object.keys(this.resourceIdByPackageName),
      this.env
    );

    if (!isValidResource(data, category)) {
      return {
        id: null,
        status: 'INVALID',
      };
    }

    await this.updateResource({
      ...data,
      id,
      category,
      bookmarked: [],
      viewCounts: 0,
      createdAt: now,
      createdBy: userId,
    });

    if (category === 'packages') {
      this.resourceIdByPackageName[data.title] = id;
      this.state.storage.put('index/PackageName', this.resourceIdByPackageName);
    }

    return {
      id,
      status: 'PUBLISHED',
    };
  }

  async getResource(resourceId: string) {
    const resource = await this.state.storage.get<Resource>(resourceId);

    if (!resource) {
      return null;
    }

    return resource;
  }

  async updateResource(resource: Resource): Promise<Resource> {
    await this.state.storage.put(resource.id, resource);
    await this.updateResourceCache(resource);

    return resource;
  }

  async updateResourceCache(resource: Resource): Promise<void> {
    const metadata: ResourceMetadata = {
      id: resource.id,
      url: resource.url,
      category: resource.category,
      author: resource.author,
      title: resource.title,
      description: resource.description?.slice(0, 80),
      integrations: resource.integrations,
      viewCounts: resource.viewCounts,
      bookmarkCounts: resource.bookmarked.length,
      createdAt: resource.createdAt,
    };

    await this.env.CONTENT.put(
      `resources/${resource.id}`,
      JSON.stringify(resource),
      {
        metadata,
      }
    );
  }
}
