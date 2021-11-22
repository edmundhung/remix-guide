/**
 * Durable object - Counter
 * @see https://developers.cloudflare.com/workers/learning/using-durable-objects
 */
export class Counter {
  constructor(state, env) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      let stored = await this.state.storage.get('value');
      this.countsByKey = stored || {};
    });
  }

  async fetch(request) {
    try {
      let url = new URL(request.url);
      let method = request.method.toUpperCase();

      switch (url.pathname) {
        case '/increment':
          if (method !== 'POST') {
            break;
          }

          const { key } = await request.json();
          this.countsByKey[key] = (this.countsByKey[key] ?? 0) + 1;
          await this.state.storage.put('value', this.countsByKey);
          return new Response('OK', { status: 200 });
        case '/':
          if (method !== 'GET') {
            break;
          }

          const keys = url.searchParams.getAll('keys');
          const countsByKey = keys.reduce((result, key) => {
            result[key] = this.countsByKey[key] ?? 0;

            return result;
          }, {});

          return new Response(JSON.stringify(countsByKey), { status: 200 });
      }

      return new Response('Not found', { status: 404 });
    } catch (e) {
      console.log(`Counter failed handling fetch call - ${request.url}`, e);

      return new Response('Internal Server Error', { status: 500 });
    }
  }
}

export function createCounter(namespace: DurableObjectNamespace) {
  function getCounter(name: string): Counter {
    const id = namespace.idFromName(name);
    const obj = namespace.get(id);

    return obj;
  }

  return {
    async check(name: string, keys: string[]): Promise<Record<string, number>> {
      const counter = getCounter(name);
      const searchParams = new URLSearchParams(
        keys.map((key) => ['keys', key])
      );
      const response = await counter.fetch(
        `http://counter/?${searchParams.toString()}`
      );
      const data = await response.json();

      return data;
    },
    async increment(name: string, key: string): Promise<void> {
      const counter = getCounter(name);
      const response = await counter.fetch('http://counter/increment', {
        method: 'POST',
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        console.log(
          `Counter: Fail incrementing counts for ${key} from ${name}`
        );
      }
    },
  };
}
