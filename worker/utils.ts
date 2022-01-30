const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;

/**
 * Enocding UNIX Timestamp using Crockford's Base32
 * Inspired by ULID JS Implementation
 * @see https://github.com/ulid/javascript/blob/master/lib/index.ts#L66-L87
 */
export function generateId(now = Date.now()): string {
	let mod: number,
		str = '';

	for (let i = 10; i > 0; i--) {
		mod = now % ENCODING_LEN;
		str = ENCODING.charAt(mod) + str;
		now = (now - mod) / ENCODING_LEN;
	}

	return str;
}

export function createStoreFetch(
	namespace: DurableObjectNamespace,
	hostname: string,
) {
	async function fetchStore(
		name: string,
		pathname: string,
		method: string,
		data?: Record<string, any>,
	): Promise<any> {
		const id = namespace.idFromName(name);
		const store = namespace.get(id);
		const origin = `http://${name}.${hostname}${pathname}`;
		const searchParams =
			method === 'GET' && data
				? new URLSearchParams(
						Object.entries(data).filter(
							([_, value]) => value !== null && typeof value !== 'undefined',
						),
				  )
				: null;
		const body = method !== 'GET' && data ? JSON.stringify(data) : null;
		const response = await store.fetch(
			`${origin}?${searchParams?.toString()}`,
			{
				method,
				body,
			},
		);

		if (response.status === 204) {
			return;
		}

		if (!response.ok) {
			throw new Error(
				`Request ${method} ${origin} failed; Received response with status ${response.status}`,
			);
		}

		return await response.json<any>();
	}

	return fetchStore;
}
